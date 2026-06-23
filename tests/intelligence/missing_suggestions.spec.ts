import { MissingSuggestionsService } from '../../backend/src/copilot/cie/services/missing-suggestions.service';

jest.setTimeout(30000);

describe('CIE Missing Suggestions Matrix', () => {
  let service: MissingSuggestionsService;

  beforeAll(() => {
    service = new MissingSuggestionsService();
  });

  it('should suggest correct fields for lost mobile', () => {
    const suggestions = service.getSuggestions('LOST_MOBILE', ['imei', 'incident_location']);
    expect(suggestions).toContain('IMEI Number');
    expect(suggestions).toContain('Last Seen Location');
  });

  it('should suggest correct fields for cyber fraud', () => {
    const suggestions = service.getSuggestions('CYBER_FRAUD', ['transaction_id', 'bank_name']);
    expect(suggestions).toContain('Transaction ID');
    expect(suggestions).toContain('Bank Name');
  });
});
