export type ConfidenceBand = "LOW" | "MEDIUM" | "HIGH";
export type UnderstandingStatus = "UNDERSTOOD" | "PARTIALLY_UNDERSTOOD" | "NOT_UNDERSTOOD";

export interface CueResult {
  originalNarrative: string;
  normalizedNarrative: string;
  language: string;
  languageConfidence: number;
  entities: {
    type: string;
    value: string;
  }[];
  transformationLog: {
    from: string;
    to: string;
    source: "DIALECT" | "SYNONYM" | "ABBREVIATION";
    dictionaryVersion: string;
  }[];
  unknownTerms: string[];
  normalizationConfidence: number;
  understandingConfidence: number;
  understandingBand: ConfidenceBand;
  understandingStatus: UnderstandingStatus;
  usedAI: boolean;
  requiresAIReview: boolean;
  cueDictionaryVersions: {
    synonyms: string;
    dialects: string;
    abbreviations: string;
    normalizationRules: string;
  };
  recommendedScenarioHints?: string[];
  scenarioHints?: {
    root: string;
    branch?: string;
    leaf?: string;
    confidence: number;
  }[];
  provider: "DICTIONARY";
  processingTimeMs: number;
  dictionaryReleaseVersion: string;
}
