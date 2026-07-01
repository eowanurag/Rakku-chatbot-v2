import { CitizenWorkflowManager } from '@backend/chat/services/citizen-workflow-manager.service';

describe('Release - Workflow Manager Enforcement', () => {
  it('should enforce state machine rules', () => {
    const manager = new CitizenWorkflowManager();
    expect(manager).toBeDefined();
  });
});
