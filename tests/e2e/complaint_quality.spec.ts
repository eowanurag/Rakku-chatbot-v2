import { ComplaintQualityService } from '../../backend/src/copilot/cie/services/complaint-quality.service';

describe('Complaint Quality E2E Spec', () => {
  let service: ComplaintQualityService;

  beforeAll(() => {
    service = new ComplaintQualityService();
  });

  it('should score excellent for complete details', () => {
    const res = service.calculateQualityScore('LOST_MOBILE', 'My phone was stolen from Lucknow junction platform 1 around 2 PM. It had important SIM cards inside.', {
      imei: '123456789012345',
      mobilemodel: 'iPhone 14',
      lastseen: 'Lucknow Junction'
    });
    expect(res.score).toBe('EXCELLENT');
    expect(res.numericScore).toBeGreaterThanOrEqual(85);
  });

  it('should score poor for empty details', () => {
    const res = service.calculateQualityScore('LOST_MOBILE', '', {});
    expect(res.score).toBe('POOR');
  });
});
