export type FactSource = "USER" | "INFERRED" | "AI";
export type ContradictionType = "TIMELINE_CONTRADICTION" | "LOCATION_CONTRADICTION" | "IDENTITY_CONTRADICTION";
export type ComplaintSessionStatus = "COLLECTING" | "CLARIFYING" | "DRAFT_READY" | "UNDER_REVIEW" | "APPROVED" | "SUBMITTED";

export interface PersonEntity {
  name?: string;
  role: "VICTIM" | "SUSPECT" | "WITNESS";
  description?: string;
  contact?: string;
}

export interface PropertyEntity {
  type: string;
  brand?: string;
  model?: string;
  color?: string;
  serialNumber?: string;
  estimatedValue?: number;
}

export interface EvidenceEntity {
  type: "IMAGE" | "VIDEO" | "DOCUMENT" | "TRANSACTION_ID" | "PHONE_NUMBER";
  value: string;
  description?: string;
}

export interface TimelineEvent {
  time?: string;
  date?: string;
  eventDescription: string;
}

export interface ExtractedFact {
  field: string;
  value: string;
  confidence: number;
  source: FactSource;
}

export interface MissingFactField {
  field: string;
  reason: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
}

export interface ContradictionFlag {
  type: ContradictionType;
  details: string;
}

export interface NarrativeSnapshot {
  version: number;
  narrative: string;
  changeSummary?: string;
  createdAt?: string;
}

export interface IncidentModel {
  incidentType: string;
  incidentDate?: string;
  incidentLocation?: string;
  narrative: string;
  people: PersonEntity[];
  property: PropertyEntity[];
  evidence: EvidenceEntity[];
  timelineEvents: TimelineEvent[];
  completenessScore: number;
}

export interface ReviewSections {
  applicantInfo: Record<string, any>;
  incidentInfo: Record<string, any>;
  timeline: TimelineEvent[];
  property: PropertyEntity[];
  evidence: EvidenceEntity[];
}

export interface ComplaintAssessmentResult {
  incidentType: string;
  complaintReadinessScore: number;
  firReadinessScore: number;
  incidentModel: IncidentModel;
  extractedFacts: ExtractedFact[];
  missingInformation: MissingFactField[];
  contradictions: ContradictionFlag[];
  draftText: string;
  reviewSections: ReviewSections;
  narrativeSnapshots?: NarrativeSnapshot[];
}
