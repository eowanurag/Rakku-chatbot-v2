import { IncidentItemService } from '../../backend/src/copilot/cie/services/incident-item.service';

describe('Item Extraction Confidence Intelligence Test', () => {
  let service: IncidentItemService;

  beforeAll(() => {
    service = new IncidentItemService();
  });

  it('should correctly set confidence based on specificity of the item', () => {
    const cases = [
      { input: 'I lost my Aadhaar card', expectedCode: 'AADHAAR_CARD', expectedConfidence: 'HIGH' },
      { input: 'I lost some documents', expectedCode: 'UNKNOWN_IDENTITY_DOCUMENTS', expectedConfidence: 'MEDIUM' },
      { input: 'I lost my things', expectedCode: 'UNKNOWN_OTHER', expectedConfidence: 'LOW' }
    ];

    for (const c of cases) {
      const res = service.extractItemsAndContainers(c.input);
      const item = res.items.find(i => i.itemCode === c.expectedCode);
      expect(item).toBeDefined();
      expect(item?.confidence).toBe(c.expectedConfidence);
    }
  });
});
