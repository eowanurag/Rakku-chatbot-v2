import { MissingInformationService } from '../../backend/src/copilot/cie/services/missing-information.service';

describe('Missing Information Intelligence Spec', () => {
  let service: MissingInformationService;

  beforeAll(() => {
    service = new MissingInformationService();
  });

  it('should detect missing required fields for LOST_MOBILE', () => {
    const res = service.detectMissing('LOST_MOBILE', { fullname: 'Ramesh', mobilenumber: '9988776655' });
    expect(res.missingRequired).toContain('Incident Details');
    expect(res.missingRequired).toContain('IMEI');
    expect(res.missingRequired).toContain('Last Seen Location');
    expect(res.completenessScore).toBeLessThan(75);
  });

  it('should detect missing optional fields for LOST_MOBILE', () => {
    const res = service.detectMissing('LOST_MOBILE', {
      fullname: 'Ramesh',
      mobilenumber: '9988776655',
      incidentdetails: 'Stolen phone',
      imei: '123456789012345',
      lastseen: 'Lucknow'
    });
    expect(res.missingRequired).toHaveLength(0);
    expect(res.missingOptional).toContain('Mobile Brand');
    expect(res.completenessScore).toBe(75); // 100% of required, 0% of optional
  });
});
