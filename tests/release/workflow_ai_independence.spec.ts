import { CitizenWorkflowManager } from '../../backend/src/chat/services/citizen-workflow-manager.service';
import { WorkflowInput } from '../../backend/src/chat/workflow.types';
import { WorkflowState, WorkflowEvent, ConfidenceLevel } from '../../backend/src/chat/workflow-state.enum';

describe('Release Certification - Workflow AI Independence', () => {
  let workflowManager: CitizenWorkflowManager;

  beforeAll(() => {
    workflowManager = new CitizenWorkflowManager();
  });

  it('should transition workflow states based purely on deterministic WorkflowInput (independent of AI source)', () => {
    const input: WorkflowInput = {
      workflowContext: {
        schemaVersion: 1,
        workflowVersion: 1,
        state: WorkflowState.ITEM_EXTRACTION,
        reviewConfirmed: false,
        confidence: ConfidenceLevel.MEDIUM,
        editCycles: 0
      },
      confidence: ConfidenceLevel.HIGH,
      ambiguity: false,
      reviewRequired: false,
      submissionReady: true
    };

    // Transition should succeed to next step
    const result = workflowManager.transition(input, WorkflowEvent.CONTINUE);
    expect(result.workflowContext.state).toBe(WorkflowState.INCIDENT_ITEMS_REVIEW);
  });
});
