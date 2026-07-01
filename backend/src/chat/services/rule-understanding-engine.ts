import { Injectable } from '@nestjs/common';
import { ComplaintTypeClassifierService } from '../../copilot/cie/services/complaint-type-classifier.service';
import { IncidentItemService, IncidentItem, IncidentContainer } from '../../copilot/cie/services/incident-item.service';
import { detectContainerContext, ContainerType } from '../../copilot/cie/config/incident-container.config';
import { UnderstandingResult, Entity } from '../../copilot/cie/dto/understanding-result.dto';

export interface UnderstandingContributor {
  contribute(text: string, current: UnderstandingResult): Promise<Partial<UnderstandingResult>>;
}

export class LanguageContributor implements UnderstandingContributor {
  async contribute(text: string, current: UnderstandingResult): Promise<Partial<UnderstandingResult>> {
    const clean = text.toLowerCase();
    let language: 'en' | 'hi' | 'hinglish' = current.language || 'en';
    
    if (/[\u0900-\u097F]/.test(clean) || clean.includes("hindi") || clean.includes("हिन्दी") || clean.includes("हिंदी")) {
      language = 'hi';
    } else if (
      ["karna hai", "karna", "chahiye", "hai", "chori", "gum", "kho", "shikayat", "mubail", "mobile", "mera"].some(w => clean.includes(w))
    ) {
      language = 'hinglish';
    }
    
    return { language };
  }
}

export class ComplaintTypeContributor implements UnderstandingContributor {
  constructor(private readonly classifier: ComplaintTypeClassifierService) {}

  async contribute(text: string, current: UnderstandingResult): Promise<Partial<UnderstandingResult>> {
    const classification = this.classifier.classify(text);
    if (classification.matches && classification.matches.length > 0) {
      const primaryType = classification.primaryType || classification.matches[0];
      const entities: Entity[] = [...current.entities];
      
      // Map to proper intent name (e.g. UPPERCASE)
      let complaintType: string | undefined = primaryType;
      let intent = 'UNKNOWN';
      if (classification.requiresClarification) {
        complaintType = undefined;
        intent = 'LOST_MOBILE'; // Default to lost mobile for routing/onboarding checks
      } else {
        if (primaryType.toLowerCase().includes('mobile') || primaryType.toLowerCase().includes('theft') || primaryType.includes('AMBIGUOUS_LOST_ITEM')) {
          intent = 'LOST_MOBILE';
        } else if (primaryType.toLowerCase().includes('document')) {
          intent = 'LOST_DOCUMENT';
        } else if (primaryType.toLowerCase().includes('cyber') || primaryType.toLowerCase().includes('fraud') || primaryType.toLowerCase().includes('financial')) {
          intent = 'CYBER_FRAUD';
        } else if (primaryType.toLowerCase().includes('harass')) {
          intent = 'HARASSMENT';
        }
      }

      entities.push({
        name: 'complaintType',
        value: primaryType,
        confidence: classification.confidence,
        origin: 'RULE'
      });

      return {
        intent,
        complaintType,
        entities,
        confidence: classification.confidence
      };
    }
    return {};
  }
}

export class ContainerContributor implements UnderstandingContributor {
  async contribute(text: string, current: UnderstandingResult): Promise<Partial<UnderstandingResult>> {
    const containerCtx = detectContainerContext(text);
    const containers: IncidentContainer[] = [...current.containers];
    const entities: Entity[] = [...current.entities];

    if (containerCtx.containers && containerCtx.containers.length > 0) {
      for (const c of containerCtx.containers) {
        if (!containers.some(existing => existing.type === c)) {
          containers.push({
            containerId: `container_${String(containers.length + 1).padStart(3, '0')}`,
            type: c as any,
            status: 'LOST',
            owner: 'SELF',
            containerConfidence: 'HIGH'
          });
        }
      }

      entities.push({
        name: 'container',
        value: containerCtx.displayLabel || containerCtx.containers[0],
        confidence: 'HIGH',
        origin: 'RULE'
      });

      return {
        containers,
        entities,
        ambiguity: containerCtx.shouldClarify || current.ambiguity
      };
    }
    return {};
  }
}

export class IncidentItemContributor implements UnderstandingContributor {
  constructor(private readonly itemService: IncidentItemService) {}

  async contribute(text: string, current: UnderstandingResult): Promise<Partial<UnderstandingResult>> {
    const existingItems = current.incidentItems;
    const existingContainers = current.containers;
    
    const extraction = this.itemService.extractItemsAndContainers(text, existingItems, existingContainers);
    
    // Calculate overall confidence based on extracted items
    const confidence = this.itemService.calculateOverallConfidence(extraction.items);

    return {
      incidentItems: extraction.items,
      containers: extraction.containers,
      confidence: confidence as any
    };
  }
}

@Injectable()
export class RuleUnderstandingEngine {
  public readonly contributors: UnderstandingContributor[];

  constructor(
    private readonly classifier: ComplaintTypeClassifierService,
    private readonly itemService: IncidentItemService
  ) {
    this.contributors = [
      new LanguageContributor(),
      new ComplaintTypeContributor(this.classifier),
      new ContainerContributor(),
      new IncidentItemContributor(this.itemService)
    ];
  }

  public async understand(
    text: string,
    existingLanguage?: 'en' | 'hi' | 'hinglish',
    existingItems: IncidentItem[] = [],
    existingContainers: IncidentContainer[] = []
  ): Promise<UnderstandingResult> {
    
    // Start with minimum guaranteed structure
    let result: UnderstandingResult = {
      version: 1,
      language: existingLanguage || 'en',
      intent: 'UNKNOWN',
      entities: [],
      incidentItems: existingItems,
      containers: existingContainers,
      confidence: 'LOW',
      ambiguity: false,
      source: 'MINIMUM_GUARANTEED'
    };

    if (!text || text.trim() === '') {
      return result;
    }

    result.source = 'RULE_ONLY';

    try {
      for (const contributor of this.contributors) {
        const patch = await contributor.contribute(text, result);
        result = { ...result, ...patch };
      }
      
      // Deduplicate containers by type
      const uniqueContainers: IncidentContainer[] = [];
      for (const c of result.containers) {
        if (!uniqueContainers.some(existing => existing.type === c.type)) {
          uniqueContainers.push(c);
        }
      }
      result.containers = uniqueContainers;
    } catch (e) {
      console.error('Error running RuleUnderstandingEngine contributors, returning MINIMUM_GUARANTEED:', e);
      result.source = 'MINIMUM_GUARANTEED';
    }

    return result;
  }
}

export interface AiEnhancementFlags {
  needsComplaintType: boolean;
  needsEntities: boolean;
  needsIncidentItems: boolean;
}

export function getAiEnhancementFlags(result: UnderstandingResult): AiEnhancementFlags {
  const needsComplaintType = result.confidence !== 'HIGH' || result.intent === 'UNKNOWN';
  const needsEntities = result.ambiguity || result.entities.length === 0;
  const needsIncidentItems = (result.containers.length > 0 && result.incidentItems.length === 0) || result.intent === 'CYBER_FRAUD';

  return {
    needsComplaintType,
    needsEntities,
    needsIncidentItems,
  };
}

export function needsAiEnhancement(result: UnderstandingResult): boolean {
  const flags = getAiEnhancementFlags(result);
  return flags.needsComplaintType || flags.needsEntities || flags.needsIncidentItems;
}

