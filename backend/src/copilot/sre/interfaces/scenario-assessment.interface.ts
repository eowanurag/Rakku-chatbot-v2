export interface ConfidenceRecord {
  version: number;
  confidence: number;
  active: boolean;
}

export interface AskedQuestion {
  questionId: string;
  informationGain: number;
  answered: boolean;
}

export interface ScenarioAssessment {
  id: string;
  sessionId: string;
  assessmentVersion: number;
  parentAssessmentId: string | null;
  scenario: string;
  scenarioPath: string[] | null;
  scenarioCompleteness: number | null;
  outcome: string;
  goal: string;
  riskLevel: string;
  confidence: number;
  confidenceHistory: ConfidenceRecord[] | null;
  reasoningSummary: string[] | null;
  actionPlan: any;
  resolutionSource: string | null;
  createdAt: Date;
}

export interface ScenarioSession {
  id: string;
  sessionId: string;
  currentScenario: string | null;
  currentState: string | null;
  clarificationCount: number;
  askedQuestions: AskedQuestion[] | null;
  outcomeSelected: boolean;
  createdAt: Date;
  updatedAt: Date;
}
