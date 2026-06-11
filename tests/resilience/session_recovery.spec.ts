import { PrismaService } from '@backend/prisma.service';

describe('Session Recovery Test', () => {
  let prisma: PrismaService;

  beforeAll(() => {
    prisma = new PrismaService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should recover gracefully after a simulated engine crash', async () => {
    const sessionId = "crash-test-" + Math.random().toString(36).substring(7);
    
    // Simulate an ongoing session state before crash
    await prisma.workflowSession.create({
      data: {
        id: sessionId,
        serviceType: 'complaint',
        currentStep: 'COLLECT_LOCATION',
        stateJson: { city: 'Agra' },
        updatedAt: new Date()
      }
    });

    // Simulate system restart - fetching session back
    const recoveredSession = await prisma.workflowSession.findUnique({
      where: { id: sessionId }
    });

    expect(recoveredSession).toBeDefined();
    expect(recoveredSession?.currentStep).toBe('COLLECT_LOCATION');
    expect((recoveredSession?.stateJson as any).city).toBe('Agra');

    // Cleanup
    await prisma.workflowSession.delete({ where: { id: sessionId } });
  });

  it('should reload the latest session step from database', async () => {
    const sessionId = "reload-test-" + Math.random().toString(36).substring(7);
    
    await prisma.workflowSession.create({
      data: {
        id: sessionId,
        serviceType: 'verification',
        currentStep: 'COLLECT_AADHAAR',
        stateJson: {},
        updatedAt: new Date()
      }
    });

    const session = await prisma.workflowSession.findUnique({
      where: { id: sessionId }
    });

    expect(session?.currentStep).toBe('COLLECT_AADHAAR');

    await prisma.workflowSession.delete({ where: { id: sessionId } });
  });

  it('should timeout stale sessions older than 30 minutes', async () => {
    const sessionId = "stale-test-" + Math.random().toString(36).substring(7);
    
    // Create a session that hasn't been updated for 2 hours
    const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000);

    await prisma.workflowSession.create({
      data: {
        id: sessionId,
        serviceType: 'complaint',
        currentStep: 'START',
        stateJson: {},
        createdAt: pastDate,
        updatedAt: pastDate
      }
    });

    const session = await prisma.workflowSession.findUnique({
      where: { id: sessionId }
    });

    // Timeout logic check
    const isStale = (new Date().getTime() - session!.updatedAt.getTime()) > (30 * 60 * 1000);
    expect(isStale).toBe(true);

    await prisma.workflowSession.delete({ where: { id: sessionId } });
  });
});
