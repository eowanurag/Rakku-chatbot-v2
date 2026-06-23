import { EvidenceGuidanceService } from '../../backend/src/copilot/cie/services/evidence-guidance.service';

describe('Evidence Guidance E2E/Service Spec', () => {
  let service: EvidenceGuidanceService;

  beforeAll(() => {
    service = new EvidenceGuidanceService();
  });

  it('should return correct suggestions for LOST_MOBILE', () => {
    const res = service.getGuidance('LOST_MOBILE');
    expect(res).toBeDefined();
    expect(res?.recommendedDocs).toContain('IMEI');
    expect(res?.recommendedDocs).toContain('Purchase Bill');
  });

  it('should return correct suggestions for CYBER_FRAUD', () => {
    const res = service.getGuidance('CYBER_FRAUD');
    expect(res).toBeDefined();
    expect(res?.recommendedDocs).toContain('Transaction Screenshot');
    expect(res?.recommendedDocs).toContain('SMS Screenshot');
  });

  it('should return correct suggestions for MISSING_PERSON', () => {
    const res = service.getGuidance('MISSING_PERSON');
    expect(res).toBeDefined();
    expect(res?.recommendedDocs).toContain('Photograph');
    expect(res?.recommendedDocs).toContain('Last Seen Details');
  });
});
