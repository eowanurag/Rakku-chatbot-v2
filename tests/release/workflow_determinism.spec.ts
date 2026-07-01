import { CitizenWorkflowManager } from '../../backend/src/chat/services/citizen-workflow-manager.service';
import { WorkflowState, WorkflowEvent, ConfidenceLevel } from '../../backend/src/chat/workflow-state.enum';
import { WorkflowContext, WorkflowInput } from '../../backend/src/chat/workflow.types';

describe('Workflow Determinism - CitizenWorkflowManager', () => {
  let manager: CitizenWorkflowManager;

  beforeEach(() => {
    manager = new CitizenWorkflowManager();
  });

  it('should yield identical next state and context for identical input sets', () => {
    const context: WorkflowContext = {
      schemaVersion: 1,
      workflowVersion: 1,
      state: WorkflowState.INCIDENT_ITEMS_REVIEW,
      reviewConfirmed: false,
      confidence: ConfidenceLevel.HIGH,
      editCycles: 2,
    };
    const input: WorkflowInput = {
      workflowContext: context,
      confidence: ConfidenceLevel.HIGH,
      ambiguity: false,
      reviewRequired: false,
      submissionReady: false,
    };

    const res1 = manager.transition(input, WorkflowEvent.CONTINUE);
    const res2 = manager.transition(input, WorkflowEvent.CONTINUE);

    expect(res1.workflowContext).toEqual(res2.workflowContext);
    expect(res1.auditEvents?.[0].from).toBe(res2.auditEvents?.[0].from);
    expect(res1.auditEvents?.[0].to).toBe(res2.auditEvents?.[0].to);
    expect(res1.auditEvents?.[0].event).toBe(res2.auditEvents?.[0].event);
    expect(res1.workflowContext.state).toBe(WorkflowState.COMPLAINT_REVIEW);
  });
});
