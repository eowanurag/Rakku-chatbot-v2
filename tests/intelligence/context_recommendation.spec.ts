import { SreRecommendationsService } from '../../backend/src/copilot/sre/services/sre-recommendations.service';

describe('SRE Context Recommendation Intelligence Spec', () => {
  let recsService: SreRecommendationsService;

  beforeAll(() => {
    recsService = new SreRecommendationsService();
  });

  it('should recommend passport reissue for lost passport context', () => {
    const res = recsService.getRecommendations('lost_property', { narrative: 'I lost my passport yesterday' });
    expect(res).toContain('Passport Reissue Guidance');
  });

  it('should recommend SIM block, Cyber Fraud, and Bank Freeze for Lost Mobile with transactions', () => {
    const res = recsService.getRecommendations('lost_mobile', { narrative: 'I lost my mobile and someone performed a transaction' });
    expect(res).toContain('Block SIM');
    expect(res).toContain('Cyber Fraud Complaint');
    expect(res).toContain('Bank Freeze Guidance');
  });

  it('should recommend SIM block, Track Complaint for Lost Mobile without transactions', () => {
    const res = recsService.getRecommendations('lost_mobile', { narrative: 'I dropped my mobile in the market' });
    expect(res).toContain('Block SIM');
    expect(res).toContain('Track Complaint');
  });
});
