export interface WorkflowLaunchEvent {
  sessionId: string;
  workflowId: string;
  intent: string;
  language: string;
  data?: Record<string, any>;
}
