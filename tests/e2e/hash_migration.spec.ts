import { IncidentItemService, IncidentItem } from '../../backend/src/copilot/cie/services/incident-item.service';

describe('Hash Migration E2E Test', () => {
  let service: IncidentItemService;

  beforeAll(() => {
    service = new IncidentItemService();
  });

  it('should generate the identical hash when old session reportedItems are migrated to incidentItems', () => {
    const legacySessionData = {
      reportedItems: [
        {
          itemId: 'item_001',
          itemCode: 'MOBILE_PHONE',
          quantity: 1,
          owner: 'SELF'
        },
        {
          itemId: 'item_002',
          itemCode: 'ATM_CARD',
          quantity: 1,
          owner: 'FAMILY'
        }
      ] as IncidentItem[]
    };

    // Extract items using the helper (simulating migration)
    const migratedItems = service.getIncidentItemsHelper(legacySessionData);
    
    // Hash of old reportedItems directly
    const oldHash = service.computeIncidentHash(legacySessionData.reportedItems);
    
    // Hash of migrated incidentItems
    const newHash = service.computeIncidentHash(migratedItems);

    expect(oldHash).toBe(newHash);
    expect(newHash).not.toBe('');
  });
});
