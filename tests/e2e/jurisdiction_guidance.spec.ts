import { JurisdictionGuidanceService } from '../../backend/src/copilot/cie/services/jurisdiction-guidance.service';

describe('Jurisdiction Guidance E2E/Service Spec', () => {
  let service: JurisdictionGuidanceService;

  beforeAll(() => {
    service = new JurisdictionGuidanceService();
  });

  it('should return online availability true for lost mobile and tenant verification', () => {
    const mobileRes = service.getGuidance('Lucknow', 'lost_mobile');
    expect(mobileRes.onlineAvailability).toBe(true);
    expect(mobileRes.expectedPoliceStation).toContain('Lucknow');

    const tenantRes = service.getGuidance('Lucknow', 'tenant_verification');
    expect(tenantRes.onlineAvailability).toBe(true);
  });

  it('should return online availability false for character certificate if not in list', () => {
    const res = service.getGuidance('Kanpur', 'character_certificate');
    expect(res.onlineAvailability).toBe(false);
    expect(res.routingExpectations).toContain('physical routing');
  });
});
