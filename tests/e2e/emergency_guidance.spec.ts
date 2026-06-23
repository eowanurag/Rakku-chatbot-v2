import { SituationAssessmentService } from '../../backend/src/copilot/sae/situation-assessment.service';
import { PrismaService } from '../../backend/src/prisma.service';

describe('Emergency Guidance E2E Spec', () => {
  let service: SituationAssessmentService;

  beforeAll(() => {
    service = new SituationAssessmentService(new PrismaService(), null as any, null as any);
  });

  it('should detect suicide risk emergency and return fast path prompt', async () => {
    const res = await service.assess('I want to suicide', 'test-session-suicide');
    expect(res.riskCategory).toBe('SUICIDE_RISK');
    expect(res.urgency).toBe('CRITICAL');
    expect(res.requiresClarification).toBe(true);
    expect(res.clarificationPrompt).toContain('Suicide Helpline: **9152987821**');
    expect(res.clarificationPrompt).toContain('Do you still wish to continue filing an official complaint?');
  });

  it('should detect women safety emergency', async () => {
    const res = await service.assess('molestation or eve teasing on street', 'test-session-women');
    expect(res.riskCategory).toBe('WOMEN_SAFETY');
    expect(res.clarificationPrompt).toContain('Women Safety Helpline: **181**');
  });
});
