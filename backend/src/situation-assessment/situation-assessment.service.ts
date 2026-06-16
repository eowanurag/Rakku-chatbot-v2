import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma.service';
import { RuleClassifier } from './classification/rule-classifier';
import { PatternClassifier } from './classification/pattern-classifier';
import { AiClassifier } from './classification/ai-classifier';
import { SituationAssessment, UrgencyLevel, ConfidenceBand, AssessmentStatus, ClarificationType } from './interfaces/situation-assessment.interface';
import { LocalizationService } from '../localization/localization.service';
import { AiFallbackService } from '../common/ai-fallback/ai-fallback.service';

@Injectable()
export class SituationAssessmentService {
  private readonly logger = new Logger(SituationAssessmentService.name);
  private ruleClassifier: RuleClassifier;
  private patternClassifier: PatternClassifier;
  private aiClassifier: AiClassifier;

  private intents: string[];
  private incidentCategories: Record<string, string>;
  private urgencyRules: {
    critical_keywords: string[];
    high_keywords: string[];
    medium_keywords: string[];
    low_keywords: string[];
  };

  private confidencePolicy: {
    recommendationThreshold: number;
    clarificationThreshold: number;
    highConfidenceThreshold: number;
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly localizationService: LocalizationService,
    private readonly aiFallbackService: AiFallbackService,
  ) {
    this.ruleClassifier = new RuleClassifier();
    this.patternClassifier = new PatternClassifier();
    this.aiClassifier = new AiClassifier();

    try {
      const findSharedFile = (filename: string): string => {
        let p = path.resolve(process.cwd(), 'shared/copilot', filename);
        if (fs.existsSync(p)) return p;
        p = path.resolve(process.cwd(), '../shared/copilot', filename);
        if (fs.existsSync(p)) return p;
        for (let i = 1; i <= 5; i++) {
          const dots = '../'.repeat(i);
          p = path.resolve(__dirname, dots, 'shared/copilot', filename);
          if (fs.existsSync(p)) return p;
        }
        return path.resolve(__dirname, filename);
      };

      const intentsPath = findSharedFile('intents.json');
      const categoriesPath = findSharedFile('incident-categories.json');
      const urgencyPath = findSharedFile('urgency-rules.json');
      const policyPath = findSharedFile('confidence-policy.json');

      this.intents = [];
      try {
        const intentsData = JSON.parse(fs.readFileSync(intentsPath, 'utf8'));
        this.intents = Object.keys(intentsData.intents || {});
      } catch (e) {
        // Fallback
      }

      this.incidentCategories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
      this.urgencyRules = JSON.parse(fs.readFileSync(urgencyPath, 'utf8'));
      this.confidencePolicy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
    } catch (e) {
      this.logger.error('Failed to load shared SAE files', e);
      this.intents = [];
      this.incidentCategories = {};
      this.urgencyRules = { critical_keywords: [], high_keywords: [], medium_keywords: [], low_keywords: [] };
      this.confidencePolicy = { recommendationThreshold: 0.70, clarificationThreshold: 0.69, highConfidenceThreshold: 0.90 };
    }
  }

  private mapConfidenceBand(score: number): ConfidenceBand {
    if (score >= this.confidencePolicy.highConfidenceThreshold) return "HIGH";
    if (score >= this.confidencePolicy.recommendationThreshold) return "MEDIUM";
    return "LOW";
  }

  private calculateUrgency(text: string, intent: string): UrgencyLevel {
    const cleanText = text.toLowerCase();
    
    // Check critical keywords
    for (const kw of this.urgencyRules.critical_keywords) {
      if (cleanText.includes(kw)) return "CRITICAL";
    }

    // Default by intent
    if (["CYBER_FRAUD", "FINANCIAL_FRAUD", "HARASSMENT", "THREAT", "WOMEN_SAFETY"].includes(intent)) {
      return "HIGH";
    }
    if (["LOST_MOBILE", "LOST_PROPERTY", "PROPERTY_THEFT", "VEHICLE_THEFT", "TENANT_VERIFICATION", "EMPLOYEE_VERIFICATION", "DOMESTIC_HELP_VERIFICATION"].includes(intent)) {
      return "MEDIUM";
    }
    return "LOW";
  }

  private getRecommendedServicesAndActions(intent: string): { services: string[]; actions: string[] } {
    switch (intent) {
      case "LOST_MOBILE":
      case "LOST_PROPERTY":
        return {
          services: ["COMPLAINT", "TRACKING_GUIDANCE"],
          actions: ["Provide device details", "Locate IMEI if available", "Prepare incident timeline"]
        };
      case "CYBER_FRAUD":
        return {
          services: ["CYBER_COMPLAINT", "CYBER_HELPLINE"],
          actions: ["Preserve transaction screenshots", "Record transaction IDs", "Avoid sharing OTPs"]
        };
      case "CHARACTER_CERTIFICATE":
        return {
          services: ["CHARACTER_CERTIFICATE"],
          actions: ["Verify address details", "Keep identity proof available"]
        };
      case "TENANT_VERIFICATION":
        return {
          services: ["TENANT_VERIFICATION"],
          actions: ["Verify tenant identity card", "Obtain current mobile number of tenant", "Provide property address details"]
        };
      case "EVENT_PERMISSION":
        return {
          services: ["EVENT_PERMISSION"],
          actions: ["Describe event purpose", "Specify event dates and timeline", "Obtain jurisdiction permission"]
        };
      case "APPLICATION_TRACKING":
        return {
          services: ["APPLICATION_TRACKING"],
          actions: ["Retrieve reference number", "Enter matching mobile verification"]
        };
      default:
        return {
          services: ["GENERAL_GUIDANCE"],
          actions: ["Contact nearest desk", "Provide summary report"]
        };
    }
  }

  public generateRecommendationCard(assessment: SituationAssessment, language: "en" | "hi" | "hinglish" = "en"): string {
    const emojiMap = {
      LOW: "🟢",
      MEDIUM: "🟡",
      HIGH: "🔴",
      CRITICAL: "🚨"
    };

    const serviceNameMap = {
      en: {
        COMPLAINT: "Complaint Registration",
        CYBER_COMPLAINT: "Cyber Fraud Complaint Portal",
        CYBER_HELPLINE: "Cyber Crime Helpdesk",
        TRACKING_GUIDANCE: "Application Tracking",
        CHARACTER_CERTIFICATE: "Character Certificate Clearance",
        TENANT_VERIFICATION: "Tenant Verification Portal",
        EVENT_PERMISSION: "Event Permission Request",
        GENERAL_GUIDANCE: "Citizen Guidance Helpdesk"
      },
      hi: {
        COMPLAINT: "शिकायत पंजीकरण",
        CYBER_COMPLAINT: "साइबर अपराध शिकायत पोर्टल",
        CYBER_HELPLINE: "साइबर अपराध सहायता डेस्क",
        TRACKING_GUIDANCE: "आवेदन ट्रैकिंग",
        CHARACTER_CERTIFICATE: "चरित्र प्रमाण पत्र निकासी",
        TENANT_VERIFICATION: "किरायेदार सत्यापन पोर्टल",
        EVENT_PERMISSION: "कार्यक्रम अनुमति अनुरोध",
        GENERAL_GUIDANCE: "नागरिक मार्गदर्शन सहायता डेस्क"
      },
      hinglish: {
        COMPLAINT: "Complaint Registration",
        CYBER_COMPLAINT: "Cyber Complaint Portal",
        CYBER_HELPLINE: "Cyber Crime Helpdesk",
        TRACKING_GUIDANCE: "Application Tracking",
        CHARACTER_CERTIFICATE: "Character Certificate Clearance",
        TENANT_VERIFICATION: "Tenant Verification Portal",
        EVENT_PERMISSION: "Event Permission Request",
        GENERAL_GUIDANCE: "Citizen Guidance Helpdesk"
      }
    };

    const currentMap = serviceNameMap[language] || serviceNameMap.en;

    const servicesList = assessment.recommendedServices
      .map((s, idx) => `${idx + 1}. ${currentMap[s] || s}`)
      .join('\n');

    const actionsList = assessment.recommendedActions
      .map(a => `✓ ${a}`)
      .join('\n');

    const iUnderstand = this.localizationService.translate("COPILOT_I_UNDERSTAND", language, {
      category: assessment.incidentCategory.toLowerCase().replace('_', ' ')
    });
    const urgencyLabel = this.localizationService.translate("COPILOT_URGENCY", language);
    const actionsLabel = this.localizationService.translate("COPILOT_RECOMMENDED_ACTIONS", language);
    const servicesLabel = this.localizationService.translate("COPILOT_RECOMMENDED_SERVICES", language);
    const promptLabel = this.localizationService.translate("COPILOT_CARD_PROMPT", language);

    return `${iUnderstand}

${urgencyLabel}:
${emojiMap[assessment.urgency] || "⚪"} ${assessment.urgency}

${actionsLabel}:
${actionsList}

${servicesLabel}:
${servicesList}

${promptLabel}`;
  }

  public async assess(text: string, sessionId: string, language: "en" | "hi" | "hinglish" = "en"): Promise<SituationAssessment> {
    // Check ENABLE_SAE feature flag
    if (process.env.ENABLE_SAE === 'false') {
      return {
        intent: "UNKNOWN",
        incidentCategory: "GUIDANCE",
        recommendedServices: ["GENERAL_GUIDANCE"],
        recommendedActions: ["V1_FALLBACK_SELECTOR"],
        confidence: 0.0,
        confidenceBand: "LOW",
        recommendationConfidence: 0.0,
        recommendationConfidenceBand: "LOW",
        urgency: "LOW",
        assessmentStatus: "CLARIFICATION_REQUIRED",
        storyCompleteness: 0.0,
        detectedEntities: {},
        reasoning: ["SAE feature flag is disabled (ENABLE_SAE=false)."],
        requiresClarification: true,
        clarificationType: "SERVICE_SELECTION",
        clarificationPrompt: "Please select a service from the menu.",
        missingInformation: []
      };
    }

    // Try to resolve active language dynamically from database if possible
    let activeLang = language;
    try {
      const wSess = await this.prisma.workflowSession.findUnique({
        where: { id: sessionId }
      });
      if (wSess && wSess.stateJson) {
        const stateJson = wSess.stateJson as any;
        if (stateJson.language) {
          activeLang = stateJson.language;
        }
      }
    } catch (e) {
      // ignore
    }

    // 1. Try Rule-based
    let ruleResult = this.ruleClassifier.classify(text);
    let finalIntent = "UNKNOWN";
    let finalCategory = "GUIDANCE";
    let confidence = 0.5;

    if (ruleResult) {
      finalIntent = ruleResult.intent;
      finalCategory = ruleResult.category;
      confidence = ruleResult.confidence;
    } else {
      // 2. Try Pattern-based
      const patternResult = this.patternClassifier.classify(text);
      if (patternResult) {
        finalIntent = patternResult.intent;
        finalCategory = this.incidentCategories[finalIntent] || "GUIDANCE";
        confidence = patternResult.confidence;
      }
    }

    let assessment: SituationAssessment;

    if (confidence >= this.confidencePolicy.recommendationThreshold) {
      const { services, actions } = this.getRecommendedServicesAndActions(finalIntent);
      const urgency = this.calculateUrgency(text, finalIntent);
      
      const requiresClarification = confidence <= this.confidencePolicy.clarificationThreshold || finalIntent === "UNKNOWN";
      
      assessment = {
        intent: finalIntent,
        incidentCategory: finalCategory,
        recommendedServices: services,
        recommendedActions: actions,
        confidence,
        confidenceBand: this.mapConfidenceBand(confidence),
        recommendationConfidence: confidence * 0.9,
        recommendationConfidenceBand: this.mapConfidenceBand(confidence * 0.9),
        urgency,
        assessmentStatus: requiresClarification ? "CLARIFICATION_REQUIRED" : "DETECTED",
        storyCompleteness: requiresClarification ? 0.25 : 0.85,
        detectedEntities: {
          locations: [],
          dates: [],
          people: [],
          property: []
        },
        reasoning: ["Classified using deterministic local matching layers."],
        requiresClarification,
        missingInformation: requiresClarification ? [
          { field: "incident_location", reason: "Required to locate jurisdiction cell", priority: "HIGH" }
        ] : [],
      };
    } else {
      // 3. Fallback to Gemini AI
      try {
        const aiAssessment = await this.aiClassifier.classify(text);
        
        // Ensure bands and status are mapped properly
        aiAssessment.confidenceBand = this.mapConfidenceBand(aiAssessment.confidence);
        aiAssessment.recommendationConfidenceBand = this.mapConfidenceBand(aiAssessment.recommendationConfidence);
        aiAssessment.assessmentStatus = aiAssessment.requiresClarification ? "CLARIFICATION_REQUIRED" : "DETECTED";
        
        assessment = aiAssessment;
      } catch (err) {
        // Centralized fallback error logic
        const failureData = this.aiFallbackService.handleAIFailure(err, activeLang);

        assessment = {
          intent: "UNKNOWN",
          incidentCategory: "GUIDANCE",
          recommendedServices: ["GENERAL_GUIDANCE"],
          recommendedActions: ["Provide details"],
          confidence: 0.5,
          confidenceBand: "LOW",
          recommendationConfidence: 0.5,
          recommendationConfidenceBand: "LOW",
          urgency: "LOW",
          assessmentStatus: "CLARIFICATION_REQUIRED",
          storyCompleteness: 0.2,
          detectedEntities: {},
          reasoning: ["Gemini fallback encountered error: " + err.message],
          requiresClarification: true,
          clarificationType: "SERVICE_SELECTION",
          clarificationPrompt: failureData.message, // Use citizen-safe message
          missingInformation: [{ field: "summary", reason: "Ambiguous statement", priority: "HIGH" }]
        };
      }
    }

    if (assessment.requiresClarification) {
      assessment.clarificationType = assessment.clarificationType || "SERVICE_SELECTION";
      assessment.clarificationPrompt = assessment.clarificationPrompt || "I'd like to understand your situation better. Could you tell me a little more about what happened?";
    } else {
      // Dynamic rendering of card
      assessment.clarificationPrompt = this.generateRecommendationCard(assessment, activeLang);
    }

    // 4. Persistence & Versioning chain
    let nextVersion = 1;
    let parentId: string | null = null;

    try {
      const prevAssessment = await this.prisma.intentClassification.findFirst({
        where: { sessionId },
        orderBy: { createdAt: 'desc' }
      });

      if (prevAssessment) {
        nextVersion = prevAssessment.assessmentVersion + 1;
        parentId = prevAssessment.id;
      }

      const savedAssessment = await this.prisma.intentClassification.create({
        data: {
          sessionId,
          assessmentVersion: nextVersion,
          parentAssessmentId: parentId,
          rawNarrative: text,
          predictedIntent: assessment.intent,
          incidentCategory: assessment.incidentCategory,
          recommendedServices: assessment.recommendedServices,
          recommendedActions: assessment.recommendedActions,
          confidence: assessment.confidence,
          confidenceBand: assessment.confidenceBand,
          recommendationConfidence: assessment.recommendationConfidence,
          recommendationConfidenceBand: assessment.recommendationConfidenceBand,
          urgency: assessment.urgency,
          assessmentStatus: assessment.assessmentStatus,
          storyCompleteness: assessment.storyCompleteness,
          detectedEntities: assessment.detectedEntities as any,
          reasoning: assessment.reasoning as any
        }
      });

      // 5. Update session lifecycle
      await this.prisma.situationAssessmentSession.upsert({
        where: { sessionId },
        update: {
          latestIntent: assessment.intent,
          latestConfidence: assessment.confidence,
          assessmentStatus: assessment.assessmentStatus,
          clarificationRequired: assessment.requiresClarification
        },
        create: {
          sessionId,
          latestIntent: assessment.intent,
          latestConfidence: assessment.confidence,
          assessmentStatus: assessment.assessmentStatus,
          clarificationRequired: assessment.requiresClarification
        }
      });
      
      // Attach the saved record ID to the result
      (assessment as any).id = savedAssessment.id;

    } catch (dbErr) {
      this.logger.warn(`Failed to persist assessment to database: ${dbErr.message}`);
    }

    return assessment;
  }
}
