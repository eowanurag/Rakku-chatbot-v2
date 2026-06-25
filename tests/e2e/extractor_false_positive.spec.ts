import { IncidentItemService } from '../../backend/src/copilot/cie/services/incident-item.service';

describe('Extractor False Positive E2E Regression Test', () => {
  let service: IncidentItemService;

  beforeAll(() => {
    service = new IncidentItemService();
  });

  it('should not extract CASH for words like purse, person, first, passport, driver\'s, or pan card', () => {
    const inputs = [
      'I lost my purse',
      'Contact person',
      'The first item',
      'My passport is lost',
      'Lost my driver\'s license',
      'Found a Pan card'
    ];

    for (const input of inputs) {
      const res = service.extractItemsAndContainers(input);
      const cashItem = res.items.find(i => i.itemCode === 'CASH');
      expect(cashItem).toBeUndefined();
    }
  });

  it('should extract PASSPORT and not CASH for "bag containing passport"', () => {
    const res = service.extractItemsAndContainers('bag containing passport');
    const cashItem = res.items.find(i => i.itemCode === 'CASH');
    const passportItem = res.items.find(i => i.itemCode === 'PASSPORT');
    
    expect(cashItem).toBeUndefined();
    expect(passportItem).toBeDefined();
  });
});
