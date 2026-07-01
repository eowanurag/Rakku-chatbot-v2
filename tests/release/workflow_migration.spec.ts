import { CitizenWorkflowManager } from '../../backend/src/chat/services/citizen-workflow-manager.service';
import { WorkflowState } from '../../backend/src/chat/workflow-state.enum';

describe('Workflow Migration Verification', () => {
  let manager: CitizenWorkflowManager;

  beforeEach(() => {
    manager = new CitizenWorkflowManager();
  });

  it('should initialize and migrate legacy session states to structure workflow schema', () => {
    const legacySession: any = {
      step: 'REVIEW',
      data: {
        incidentItems: [{ itemId: 'item_001', itemCode: 'PASSPORT' }],
        // no workflow context
      },
    };

    // Recover step translates legacy state to INCIDENT_ITEMS_REVIEW because it was not confirmed yet
    const recoveryStep = manager.getRecoveryStep(legacySession);
    expect(recoveryStep).toBe(WorkflowState.INCIDENT_ITEMS_REVIEW);

    // Initializing updates context
    manager.resetWorkflow(legacySession);
    expect(legacySession.data.workflow).toBeDefined();
    expect(legacySession.data.workflow.state).toBe(WorkflowState.ITEM_EXTRACTION);
    expect(legacySession.data.workflow.reviewConfirmed).toBe(false);
    expect(legacySession.data.workflow.editCycles).toBe(0);
  });
});
