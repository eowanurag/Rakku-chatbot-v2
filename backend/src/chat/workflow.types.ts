import { WorkflowState, ConfidenceLevel } from './workflow-state.enum';

export interface WorkflowContext {
  readonly schemaVersion: number;
  readonly workflowVersion: number;
  readonly state: WorkflowState;
  readonly reviewConfirmed: boolean;
  readonly confidence: ConfidenceLevel;
  readonly editCycles: number;
}

export interface WorkflowInput {
  workflowContext: WorkflowContext;
  confidence: ConfidenceLevel;
  ambiguity: boolean;
  reviewRequired: boolean;
  submissionReady: boolean;
}

export interface WorkflowAdvice {
  requiresReview: boolean;
  requiresClarification: boolean;
  submissionBlocked: boolean;
  recommendedComplaintType?: string;
}
