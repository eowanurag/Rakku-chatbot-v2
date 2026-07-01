import { Injectable } from '@nestjs/common';
import { UnderstandingResult, Entity } from '../../copilot/cie/dto/understanding-result.dto';
import { IncidentItem, IncidentContainer } from '../../copilot/cie/services/incident-item.service';

@Injectable()
export class UnderstandingMerger {
  public mergeUnderstanding(rule: UnderstandingResult, ai: UnderstandingResult): UnderstandingResult {
    // Start with a clone of rule understanding to preserve deterministic rules
    const merged: UnderstandingResult = {
      version: rule.version || ai.version || 1,
      language: rule.language || ai.language || 'en',
      intent: rule.intent && rule.intent !== 'UNKNOWN' ? rule.intent : ai.intent,
      complaintType: rule.complaintType || ai.complaintType,
      entities: [...rule.entities],
      incidentItems: [...rule.incidentItems],
      containers: [...rule.containers],
      confidence: rule.confidence === 'HIGH' ? 'HIGH' : ai.confidence,
      ambiguity: rule.ambiguity || ai.ambiguity,
      source: 'MERGED'
    };

    // 1. Merge entities conservatively
    if (ai.entities && ai.entities.length > 0) {
      for (const aiEnt of ai.entities) {
        const existingIdx = merged.entities.findIndex(e => e.name === aiEnt.name);
        if (existingIdx !== -1) {
          const ruleEnt = merged.entities[existingIdx];
          // If rule entity is not HIGH confidence, let AI enhance it
          if (ruleEnt.confidence !== 'HIGH') {
            merged.entities[existingIdx] = {
              ...ruleEnt,
              value: aiEnt.value,
              confidence: aiEnt.confidence,
              origin: 'AI'
            };
          }
        } else {
          merged.entities.push({
            name: aiEnt.name,
            value: aiEnt.value,
            confidence: aiEnt.confidence,
            origin: 'AI'
          });
        }
      }
    }

    // 2. Merge containers conservatively
    if (ai.containers && ai.containers.length > 0) {
      for (const aiCont of ai.containers) {
        const existing = merged.containers.find(c => c.type === aiCont.type);
        if (!existing) {
          // Rule didn't find this container type, so we can add it
          merged.containers.push({
            ...aiCont,
            containerId: `container_${String(merged.containers.length + 1).padStart(3, '0')}`
          });
        }
      }
    }

    // 3. Merge incident items and their attributes conservatively
    if (ai.incidentItems && ai.incidentItems.length > 0) {
      for (const aiItem of ai.incidentItems) {
        const existingIdx = merged.incidentItems.findIndex(i => i.itemCode === aiItem.itemCode);
        if (existingIdx !== -1) {
          const ruleItem = merged.incidentItems[existingIdx];
          // Merge attributes only
          const mergedAttributes = {
            ...(ruleItem.attributes || {}),
            ...(aiItem.attributes || {})
          };
          merged.incidentItems[existingIdx] = {
            ...ruleItem,
            amount: ruleItem.amount || aiItem.amount,
            quantity: ruleItem.quantity || aiItem.quantity || 1,
            attributes: mergedAttributes
          };
        } else {
          // Add new item from AI if it does not conflict
          merged.incidentItems.push({
            ...aiItem,
            itemId: `item_${String(merged.incidentItems.length + 1).padStart(3, '0')}`
          });
        }
      }
    }

    // Update merged complaintType from entities if available
    const compTypeEnt = merged.entities.find(e => e.name === 'complaintType');
    if (compTypeEnt) {
      merged.complaintType = compTypeEnt.value;
    }

    return merged;
  }
}
