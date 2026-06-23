import { FieldAssistanceService } from '../../backend/src/copilot/cie/services/field-assistance.service';
import { MissingInformationService } from '../../backend/src/copilot/cie/services/missing-information.service';

describe('Citizen Assistance Gate Release Spec', () => {
  it('should pass if guided configuration features and missing check matches specifications', () => {
    const fieldService = new FieldAssistanceService();
    const missingService = new MissingInformationService();

    expect(fieldService.getFormattedHints('LOST_MOBILE')).toHaveLength(3);
    const missingRes = missingService.detectMissing('LOST_MOBILE', { fullname: 'Test Citizen' });
    expect(missingRes.missingRequired).toContain('Mobile Number');
  });
});
