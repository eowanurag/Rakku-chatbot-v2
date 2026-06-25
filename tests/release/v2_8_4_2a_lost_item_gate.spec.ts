import { ComplaintTypeClassifierService } from '../../backend/src/copilot/cie/services/complaint-type-classifier.service';
import { SreRecommendationsService } from '../../backend/src/copilot/sre/services/sre-recommendations.service';

describe('V2.8.4.2a Lost Item Release Gate', () => {
  let classifier: ComplaintTypeClassifierService;
  let recommendations: SreRecommendationsService;

  beforeAll(() => {
    classifier = new ComplaintTypeClassifierService();
    recommendations = new SreRecommendationsService();
  });

  it('should prevent direct mapping of purse/wallet/bag to concrete types', () => {
    const purseRes = classifier.classify('lost purse');
    expect(purseRes.primaryType).toBe('AMBIGUOUS_LOST_ITEM');
    expect(purseRes.requiresClarification).toBe(true);

    const walletRes = classifier.classify('lost wallet');
    expect(walletRes.primaryType).toBe('AMBIGUOUS_LOST_ITEM');
    expect(walletRes.requiresClarification).toBe(true);

    const bagRes = classifier.classify('my bag is missing');
    expect(bagRes.primaryType).toBe('AMBIGUOUS_LOST_ITEM');
    expect(bagRes.requiresClarification).toBe(true);
  });

  it('should preserve and append secondary recommendations', () => {
    const context = {
      secondaryRecommendations: [
        'Block ATM Cards',
        'Call 1930'
      ]
    };
    const recList = recommendations.getRecommendations('Lost Document', context);
    expect(recList).toContain('Block ATM Cards');
    expect(recList).toContain('Call 1930');
  });
});
