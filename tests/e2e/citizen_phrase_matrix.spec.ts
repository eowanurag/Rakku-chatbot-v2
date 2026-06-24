import { ComplaintTypeClassifierService } from '@backend/copilot/cie/services/complaint-type-classifier.service';

describe('Citizen Phrase Matrix E2E', () => {
  let classifier: ComplaintTypeClassifierService;

  beforeAll(() => {
    classifier = new ComplaintTypeClassifierService();
  });

  it('should map standard citizen phrases to normalized types correctly', () => {
    const phraseMatrix = [
      { phrase: 'I lost my purse', expected: 'Lost Document' },
      { phrase: 'My wallet is missing', expected: 'Lost Document' },
      { phrase: 'Phone got stolen', expected: 'Lost Mobile / Theft' },
      { phrase: 'Someone cheated me online', expected: 'Cyber Fraud / Financial Loss' },
      { phrase: 'I am being harassed', expected: 'Simple Harassment' }
    ];

    for (const item of phraseMatrix) {
      const res = classifier.classify(item.phrase);
      expect(res.matches).toContain(item.expected);
    }
  });
});
