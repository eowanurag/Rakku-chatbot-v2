export interface EngineResponse {
  sessionId: string;
  workflowId?: string;
  textResponse: string;
  suggestions?: string[];
  formTemplate?: unknown;
  nextStep?: string;
  workflowStatus?: "ACTIVE" | "PAUSED" | "COMPLETED";
  isUrgent?: boolean;
}

export interface WorkflowStep {
  id: string;
  title: string;
  requiredFields: string[];
  isReview: boolean;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  steps: WorkflowStep[];
}
