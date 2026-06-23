import { SituationAssessmentService } from '../../backend/src/copilot/sae/situation-assessment.service';
import { PrismaService } from '../../backend/src/prisma.service';

jest.setTimeout(30000);

describe('SAE Escalation Matrix', () => {
  let service: SituationAssessmentService;
  let prisma: PrismaService;

  beforeAll(() => {
    prisma = new PrismaService();
    service = new SituationAssessmentService(prisma, { translate: (k: string) => k } as any, { handleAIFailure: () => ({ message: '' }) } as any);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should escalate to Priority or Emergency based on severity levels', async () => {
    const assessmentLow = await service.assess('lost key', 'test-sae-esc-1');
    expect(assessmentLow.escalation).toBe('NORMAL');
  });
});
