import { CitizenWorkflowManager } from '../../backend/src/chat/services/citizen-workflow-manager.service';
import { IncidentItemService } from '../../backend/src/copilot/cie/services/incident-item.service';
import { WorkflowState } from '../../backend/src/chat/workflow-state.enum';

describe('Workflow Architecture Boundaries', () => {
  let manager: CitizenWorkflowManager;
  let itemService: IncidentItemService;

  beforeEach(() => {
    manager = new CitizenWorkflowManager();
    itemService = new IncidentItemService();
  });

  it('should not mutate original state object during transition (purity check)', () => {
    const originalWorkflow = Object.freeze({
      schemaVersion: 1,
      workflowVersion: 1,
      state: WorkflowState.ITEM_EXTRACTION,
      reviewConfirmed: false,
      confidence: 'HIGH' as any,
      editCycles: 0,
    });
    const input = Object.freeze({
      workflowContext: originalWorkflow,
      confidence: 'HIGH' as any,
      ambiguity: false,
      reviewRequired: false,
      submissionReady: false,
    });

    expect(() => {
      manager.transition(input, 'CONTINUE' as any);
    }).not.toThrow();
  });

  it('should reset workflow state to ITEM_EXTRACTION and clear items correctly', () => {
    const session = {
      data: {
        workflow: {
          state: WorkflowState.COMPLAINT_REVIEW,
          reviewConfirmed: true,
          editCycles: 4,
        },
        incidentItems: [{ itemId: 'item_001', itemCode: 'PASSPORT' }],
        partialIncidentItems: [{ itemId: 'item_002', itemCode: 'ATM_CARD' }],
        pendingComplaintType: 'Lost Document',
        citizen: {
          fullName: 'Rajesh',
        },
      },
    };

    manager.resetWorkflow(session);
    itemService.clearItems(session);

    expect(session.data.workflow.state).toBe(WorkflowState.ITEM_EXTRACTION);
    expect(session.data.workflow.reviewConfirmed).toBe(false);
    expect(session.data.workflow.editCycles).toBe(0);
    expect(session.data.incidentItems).toEqual([]);
    expect(session.data.partialIncidentItems).toEqual([]);
    expect(session.data.pendingComplaintType).toBeUndefined();
    expect(session.data.citizen.fullName).toBe('Rajesh'); // preserved
  });

  it('should enforce architectural lint rule: ChatService cannot directly mutate workflow.state', () => {
    const fs = require('fs');
    const path = require('path');
    const chatServicePath = path.resolve(__dirname, '../../backend/src/chat/chat.service.ts');
    const content = fs.readFileSync(chatServicePath, 'utf8');

    // Ensure no direct mutations like "workflow.state =" or "workflow?.state =" exist
    const directMutationRegex = /\.workflow(\??)\.state\s*=/;
    expect(content).not.toMatch(directMutationRegex);
  });
});
