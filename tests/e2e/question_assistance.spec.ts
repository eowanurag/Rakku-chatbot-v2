import { QuestionAssistanceService } from '../../backend/src/copilot/workflow-completion/question-assistance.service';

describe('Question Assistance E2E/Service Spec', () => {
  let service: QuestionAssistanceService;

  beforeAll(() => {
    service = new QuestionAssistanceService();
  });

  it('should return correct hints and examples', () => {
    const res = service.getAssistance('INCIDENT_DATE');
    expect(res).toBeDefined();
    expect(res?.hint.toLowerCase()).toContain('date');
    expect(res?.example).toContain('01/01/2026');

    const addressHelp = service.getHelpText('ADDRESS');
    expect(addressHelp).toContain('Sector 5, Gomti Nagar');
  });
});
