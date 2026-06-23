import { ComplaintCompletenessService } from '../../backend/src/copilot/cie/services/complaint-completeness.service';

jest.setTimeout(30000);

describe('CIE Completeness Matrix', () => {
  let service: ComplaintCompletenessService;

  beforeAll(() => {
    service = new ComplaintCompletenessService();
  });

  it('should map scores to correct readiness status', () => {
    expect(service.calculateCompleteness(0.2)).toBe('INCOMPLETE');
    expect(service.calculateCompleteness(0.6)).toBe('PARTIAL');
    expect(service.calculateCompleteness(0.95)).toBe('READY');
  });
});
