import { SreRecommendationsService } from '../../backend/src/copilot/sre/services/sre-recommendations.service';

describe('Recommendation Rules Intelligence Spec', () => {
  let service: SreRecommendationsService;

  beforeAll(() => {
    service = new SreRecommendationsService();
  });

  it('should recommend correct actions for Lost Phone', () => {
    const recs = service.getRecommendations('LOST_MOBILE');
    expect(recs).toContain('Block SIM');
    expect(recs).toContain('Track Complaint');
    expect(recs).toContain('Cyber Fraud Complaint');
  });

  it('should recommend correct actions for Cyber Fraud', () => {
    const recs = service.getRecommendations('CYBER_FRAUD');
    expect(recs).toContain('Call 1930');
    expect(recs).toContain('Freeze Bank Account');
    expect(recs).toContain('Upload transaction details');
  });

  it('should recommend character certificate for tenant verification', () => {
    const recs = service.getRecommendations('TENANT_VERIFICATION');
    expect(recs).toContain('Character Certificate');
  });
});
