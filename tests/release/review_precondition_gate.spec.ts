import { CitizenWorkflowManager } from '@backend/chat/services/citizen-workflow-manager.service';
import { WorkflowState } from '@backend/chat/workflow-state.enum';

describe('Release - Review Precondition Gate', () => {
  it('should reject transition to review if complaint type is missing', () => {
    const manager = new CitizenWorkflowManager();
    const session = { data: { type: undefined } };
    const step = manager.resolveMissingWorkflowStep(session, { workflowContext: { state: WorkflowState.COMPLAINT_REVIEW, reviewConfirmed: false, editCycles: 0 } } as any);
    expect(step).toBe(WorkflowState.COMPLAINT_TYPE_SELECTION);
  });
});
