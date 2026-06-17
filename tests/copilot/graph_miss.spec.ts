import { GraphMissService } from '../../backend/src/copilot/sre/analytics/graph-miss.service';
import { PrismaService } from '../../backend/src/prisma.service';

describe('GraphMissService', () => {
  let service: GraphMissService;
  let prisma: PrismaService;

  beforeAll(() => {
    prisma = new PrismaService();
    service = new GraphMissService(prisma);
  });

  afterAll(async () => {
    await prisma.scenarioGraphCandidate.deleteMany();
    await prisma.$disconnect();
  });

  it('should successfully record and update a new graph miss candidate in database', async () => {
    await prisma.scenarioGraphCandidate.deleteMany();

    // 1. First Miss
    await service.recordGraphMiss("LOSS", "AADHAAR_CARD");
    
    let candidate = await prisma.scenarioGraphCandidate.findFirst({
      where: { parentNode: "LOSS", proposedNode: "AADHAAR_CARD" }
    });
    
    expect(candidate).toBeDefined();
    expect(candidate?.occurrences).toBe(1);
    expect(candidate?.status).toBe("PENDING");

    // 2. Second Miss (Updates occurrences)
    await service.recordGraphMiss("LOSS", "AADHAAR_CARD");

    candidate = await prisma.scenarioGraphCandidate.findFirst({
      where: { parentNode: "LOSS", proposedNode: "AADHAAR_CARD" }
    });

    expect(candidate?.occurrences).toBe(2);
  });
});
