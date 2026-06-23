import { ComplaintQualityService } from '../../backend/src/copilot/cie/services/complaint-quality.service';

describe('Quality Score Intelligence Spec', () => {
  let service: ComplaintQualityService;

  beforeAll(() => {
    service = new ComplaintQualityService();
  });

  it('should map scores correctly', () => {
    const poorRes = service.calculateQualityScore('LOST_MOBILE', '', {});
    expect(poorRes.score).toBe('POOR');

    const goodRes = service.calculateQualityScore('LOST_MOBILE', 'My phone brand new stolen from station', { imei: '123456789' });
    expect(goodRes.score).toBe('GOOD');
  });
});
