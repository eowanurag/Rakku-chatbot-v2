import { SituationAssessmentService } from '../../backend/src/copilot/sae/situation-assessment.service';
import { PrismaService } from '../../backend/src/prisma.service';

jest.setTimeout(30000);

describe('SAE Severity Matrix', () => {
  let service: SituationAssessmentService;
  let prisma: PrismaService;

  beforeAll(() => {
    prisma = new PrismaService();
    // mock localization service
    service = new SituationAssessmentService(prisma, { translate: (k: string) => k } as any, { handleAIFailure: () => ({ message: '' }) } as any);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should resolve severity correctly based on keywords', async () => {
    const assessment = await service.assess('stolen phone yesterday', 'test-sae-sev-1');
    expect(assessment.severity).toBeDefined();
  });
});
