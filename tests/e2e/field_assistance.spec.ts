import { FieldAssistanceService } from '../../backend/src/copilot/cie/services/field-assistance.service';

describe('Field Assistance E2E Spec', () => {
  let service: FieldAssistanceService;

  beforeAll(() => {
    service = new FieldAssistanceService();
  });

  it('should return correct suggestions for LOST_MOBILE', () => {
    const res = service.getSuggestions('LOST_MOBILE');
    expect(res).toBeDefined();
    expect(res?.suggestions).toHaveLength(3);
    expect(res?.suggestions[0].field).toBe('IMEI');
    expect(res?.suggestions[1].field).toBe('Device Model');
  });

  it('should return correct suggestions for CYBER_FRAUD', () => {
    const res = service.getSuggestions('CYBER_FRAUD');
    expect(res).toBeDefined();
    expect(res?.suggestions[0].field).toBe('Transaction ID');
  });

  it('should return correct suggestions for MISSING_PERSON', () => {
    const res = service.getSuggestions('MISSING_PERSON');
    expect(res).toBeDefined();
    expect(res?.suggestions[0].field).toBe('Photograph');
  });
});
