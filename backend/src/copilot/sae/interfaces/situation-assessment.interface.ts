export type UrgencyLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ConfidenceBand = "LOW" | "MEDIUM" | "HIGH";
export type AssessmentStatus = "DETECTED" | "CONFIRMED" | "REJECTED" | "CLARIFICATION_REQUIRED";
export type ClarificationType = "SERVICE_SELECTION" | "INCIDENT_DETAILS" | "LOCATION" | "TIMELINE" | "EMERGENCY_FAST_PATH";

export interface MissingInfoItem {
  field: string;
  reason: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
}

export interface SituationAssessment {
  intent: string;
  incidentCategory: string;
  recommendedServices: string[];
  recommendedActions: string[];
  confidence: number;
  confidenceBand: ConfidenceBand;
  recommendationConfidence: number;
  recommendationConfidenceBand: ConfidenceBand;
  urgency: UrgencyLevel;
  assessmentStatus: AssessmentStatus;
  storyCompleteness: number;
  detectedEntities: {
    locations?: string[];
    dates?: string[];
    people?: string[];
    property?: string[];
  };
  reasoning: string[];
  requiresClarification: boolean;
  clarificationType?: ClarificationType;
  clarificationPrompt?: string;
  missingInformation: MissingInfoItem[];
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskCategory?: "WOMEN_SAFETY" | "CHILD_RISK" | "DOMESTIC_VIOLENCE" | "CYBER_FRAUD" | "MISSING_PERSON" | "ACCIDENT" | "SUICIDE_RISK" | null;
  escalation?: "NORMAL" | "PRIORITY" | "EMERGENCY";
  immediateActions?: string[];
}
