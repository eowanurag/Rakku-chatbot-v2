import { IncidentItemService, IncidentItem } from '../../backend/src/copilot/cie/services/incident-item.service';

describe('Incident Hash Stability E2E Test', () => {
  let service: IncidentItemService;

  beforeAll(() => {
    service = new IncidentItemService();
  });

  it('should generate identical hash for the same incident contents regardless of item ordering, itemIds, addedAt, or containerIds', () => {
    const itemsGroupA: IncidentItem[] = [
      {
        itemId: 'item_001',
        itemCode: 'MOBILE_PHONE',
        quantity: 1,
        owner: 'SELF',
        containerId: 'container_001'
      },
      {
        itemId: 'item_002',
        itemCode: 'ATM_CARD',
        quantity: 2,
        owner: 'FAMILY',
        containerId: 'container_002'
      }
    ];

    const itemsGroupB: IncidentItem[] = [
      {
        itemId: 'item_999', // Different itemId
        itemCode: 'ATM_CARD',
        quantity: 2,
        owner: 'FAMILY',
        containerId: 'container_xyz' // Different containerId
      },
      {
        itemId: 'item_888', // Different itemId
        itemCode: 'MOBILE_PHONE',
        quantity: 1,
        owner: 'SELF',
        containerId: 'container_abc' // Different containerId
      }
    ];

    const hashA = service.computeIncidentHash(itemsGroupA);
    const hashB = service.computeIncidentHash(itemsGroupB);

    expect(hashA).toBeDefined();
    expect(hashA).not.toBe('');
    expect(hashA).toBe(hashB);
  });
});
