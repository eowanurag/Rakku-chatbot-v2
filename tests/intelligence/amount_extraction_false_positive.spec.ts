import { IncidentItemService } from '../../backend/src/copilot/cie/services/incident-item.service';

describe('Amount Extraction False Positive Intelligence Test', () => {
  let service: IncidentItemService;

  beforeAll(() => {
    service = new IncidentItemService();
  });

  it('should not extract CASH or amount from words containing rs like passport, person, first, course, reverse', () => {
    const cases = [
      'I lost my passport 500 times',
      'This person 100 percent saw it',
      'The first 20 items are lost',
      'I was in course 300 of study',
      'Please reverse 100 actions'
    ];

    for (const c of cases) {
      const res = service.extractItemsAndContainers(c);
      const cashItem = res.items.find(i => i.itemCode === 'CASH');
      expect(cashItem).toBeUndefined();
    }
  });
});
