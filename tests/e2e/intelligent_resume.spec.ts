import { DraftRecoveryService } from '../../backend/src/copilot/workflow-completion/draft-recovery.service';
import { PrismaService } from '../../backend/src/prisma.service';

describe('Intelligent Resume E2E/Service Spec', () => {
  let recoveryService: DraftRecoveryService;
  let prisma: PrismaService;

  beforeAll(() => {
    prisma = new PrismaService();
    recoveryService = new DraftRecoveryService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should formulate an intelligent resume message', () => {
    const msg = recoveryService.getIntelligentResumeMessage('lost_mobile', 'Incident Date');
    expect(msg).toContain('Lost Mobile');
    expect(msg).toContain('Incident Date');
    expect(msg).toContain('1 minute');
  });
});
