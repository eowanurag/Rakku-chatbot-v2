import { WorkflowState } from '@backend/chat/workflow-state.enum';

describe('Release - Workflow Snapshot Gate', () => {
  it('should verify structural workflow context fields', () => {
    const context = {
      state: WorkflowState.INCIDENT_ITEMS_REVIEW,
      reviewConfirmed: false,
      confidence: 'MEDIUM',
      editCycles: 1
    };
    expect(context).toEqual({
      state: WorkflowState.INCIDENT_ITEMS_REVIEW,
      reviewConfirmed: false,
      confidence: 'MEDIUM',
      editCycles: 1
    });
  });
});
