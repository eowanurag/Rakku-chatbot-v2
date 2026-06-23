import { SituationAssessmentService } from '../../backend/src/copilot/sae/situation-assessment.service';
import { PrismaService } from '../../backend/src/prisma.service';

jest.setTimeout(30000);

describe('SAE Risk Category Matrix', () => {
  let service: SituationAssessmentService;
  let prisma: PrismaService;

  beforeAll(() => {
    prisma = new PrismaService();
    service = new SituationAssessmentService(prisma, { translate: (k: string) => k } as any, { handleAIFailure: () => ({ message: '' }) } as any);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should map to WOMEN_SAFETY for woman harassment narrative', async () => {
    const assessment = await service.assess('a girl was harassed on the street', 'test-sae-risk-1');
    expect(assessment.riskCategory).toBe('WOMEN_SAFETY');
  });

  it('should map to CYBER_FRAUD for online bank transaction loss', async () => {
    const assessment = await service.assess('lost money from bank account in online fraud', 'test-sae-risk-2');
    expect(assessment.riskCategory).toBe('CYBER_FRAUD');
  });
});
