import { ComplaintTypeClassifierService } from '@backend/copilot/cie/services/complaint-type-classifier.service';

describe('Complaint Synonym Matrix E2E', () => {
  let classifier: ComplaintTypeClassifierService;

  beforeAll(() => {
    classifier = new ComplaintTypeClassifierService();
  });

  it('should map various synonyms correctly to their normalized complaint types', () => {
    const cases = [
      { input: 'wallet missing', expected: 'Lost Document' },
      { input: 'wallet lost', expected: 'Lost Document' },
      { input: 'purse missing', expected: 'Lost Document' },
      { input: 'my bag is lost', expected: 'Lost Document' },
      { input: 'phone gone', expected: 'Lost Mobile / Theft' },
      { input: 'mobile stolen', expected: 'Lost Mobile / Theft' },
      { input: 'documents missing', expected: 'Lost Document' },
      { input: 'cheated online', expected: 'Cyber Fraud / Financial Loss' },
      { input: 'money deducted', expected: 'Cyber Fraud / Financial Loss' },
      { input: 'threatened', expected: 'Simple Harassment' }
    ];

    for (const c of cases) {
      const res = classifier.classify(c.input);
      expect(res.matches).toContain(c.expected);
    }
  });
});
