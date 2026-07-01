import { IncidentItemService } from '../../backend/src/copilot/cie/services/incident-item.service';
import { CitizenWorkflowManager } from '../../backend/src/chat/services/citizen-workflow-manager.service';
import { ConfidenceLevel, WorkflowState } from '../../backend/src/chat/workflow-state.enum';

describe('Workflow Certification Gate - CIE & SAE', () => {
  let itemService: IncidentItemService;
  let manager: CitizenWorkflowManager;

  beforeEach(() => {
    itemService = new IncidentItemService();
    manager = new CitizenWorkflowManager();
  });

  it('should calculate confidence correctly based on rules', () => {
    expect(itemService.calculateOverallConfidence([])).toBe(ConfidenceLevel.LOW);

    const highItems = [
      { itemId: '1', itemCode: 'PASSPORT', confidence: 'HIGH' as any },
      { itemId: '2', itemCode: 'AADHAAR_CARD', confidence: 'HIGH' as any },
    ];
    expect(itemService.calculateOverallConfidence(highItems)).toBe(ConfidenceLevel.HIGH);

    const medItems = [
      { itemId: '1', itemCode: 'PASSPORT', confidence: 'HIGH' as any },
      { itemId: '2', itemCode: 'AADHAAR_CARD', confidence: 'MEDIUM' as any },
    ];
    expect(itemService.calculateOverallConfidence(medItems)).toBe(ConfidenceLevel.MEDIUM);

    const lowItems = [
      { itemId: '1', itemCode: 'PASSPORT', confidence: 'HIGH' as any },
      { itemId: '2', itemCode: 'AADHAAR_CARD', confidence: 'LOW' as any },
    ];
    expect(itemService.calculateOverallConfidence(lowItems)).toBe(ConfidenceLevel.LOW);
  });

  it('should resolve recovery step priorities correctly', () => {
    const sessionNoItems = { data: {} };
    expect(manager.getRecoveryStep(sessionNoItems)).toBe(WorkflowState.ITEM_EXTRACTION);

    const sessionWithItems = {
      data: {
        incidentItems: [{ itemId: '1', itemCode: 'PASSPORT' }],
      },
    };
    expect(manager.getRecoveryStep(sessionWithItems)).toBe(WorkflowState.INCIDENT_ITEMS_REVIEW);

    const sessionConfirmed = {
      data: {
        workflowContext: { state: WorkflowState.COMPLAINT_REVIEW, reviewConfirmed: true },
        incidentItems: [{ itemId: '1', itemCode: 'PASSPORT' }],
      },
    };
    expect(manager.getRecoveryStep(sessionConfirmed)).toBe(WorkflowState.COMPLAINT_REVIEW);
  });

  it('should apply edit modifications correctly (REMOVE -> REPLACE -> ADD)', () => {
    const items = [
      { itemId: '1', itemCode: 'ATM_CARD', confidence: 'HIGH' as any },
      { itemId: '2', itemCode: 'PASSPORT', confidence: 'HIGH' as any },
    ];

    // REMOVE
    const resRemove = itemService.applyModification(items, 'Please remove ATM card');
    expect(resRemove.items.length).toBe(1);
    expect(resRemove.items[0].itemCode).toBe('PASSPORT');

    // ADD
    const resAdd = itemService.applyModification(items, 'Please also add PAN card');
    expect(resAdd.items.length).toBe(3);
    expect(resAdd.items.some(i => i.itemCode === 'PAN_CARD')).toBe(true);

    // REPLACE
    const resReplace = itemService.applyModification(items, 'Replace ATM card with driving license');
    expect(resReplace.items.length).toBe(2);
    expect(resReplace.items.some(i => i.itemCode === 'DRIVING_LICENSE')).toBe(true);
    expect(resReplace.items.some(i => i.itemCode === 'ATM_CARD')).toBe(false);
  });
});
