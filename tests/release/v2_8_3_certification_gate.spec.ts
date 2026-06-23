import { SituationAssessmentService } from '../../backend/src/copilot/sae/situation-assessment.service';
import { PrismaService } from '../../backend/src/prisma.service';

describe('V2.8.3 Certification Gate Spec', () => {
  it('should verify deterministic emergency classifications and rule-based compliance', async () => {
    const service = new SituationAssessmentService(new PrismaService(), null as any, null as any);
    const res = await service.assess('accident on road, need help immediately, injured people bleeding', 'test-gate');
    expect(res.riskCategory).toBe('ACCIDENT');
    expect(res.urgency).toBe('CRITICAL');
  });
});
