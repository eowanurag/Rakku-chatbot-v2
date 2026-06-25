import { ComplaintTypeClassifierService } from '../../backend/src/copilot/cie/services/complaint-type-classifier.service';

describe('Lost Item Mapping Intelligence Test', () => {
  let classifier: ComplaintTypeClassifierService;

  beforeAll(() => {
    classifier = new ComplaintTypeClassifierService();
  });

  it('should correctly classify inputs according to the mapping rules', () => {
    const cases = [
      { input: 'lost purse', expectedType: 'AMBIGUOUS_LOST_ITEM', expectedClarify: true },
      { input: 'lost wallet', expectedType: 'AMBIGUOUS_LOST_ITEM', expectedClarify: true },
      { input: 'bag missing', expectedType: 'AMBIGUOUS_LOST_ITEM', expectedClarify: true },
      { input: 'wallet with Aadhaar', expectedType: 'Lost Document', expectedClarify: false },
      { input: 'purse with phone', expectedType: 'Lost Mobile / Theft', expectedClarify: false },
      { input: 'purse with cards', expectedType: 'Cyber Fraud / Financial Loss', expectedClarify: false }
    ];

    for (const c of cases) {
      const res = classifier.classify(c.input);
      expect(res.primaryType).toBe(c.expectedType);
      expect(res.requiresClarification).toBe(c.expectedClarify);
    }
  });
});
