import { ComplaintIntelligenceService } from '../../backend/src/copilot/cie/complaint-intelligence.service';
import { PrismaService } from '../../backend/src/prisma.service';

jest.setTimeout(30000);

describe('CIE Entity Extraction Matrix', () => {
  let service: ComplaintIntelligenceService;
  let prisma: PrismaService;

  beforeAll(() => {
    prisma = new PrismaService();
    service = new ComplaintIntelligenceService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should extract document details (Aadhaar)', async () => {
    const sess = 'test-cie-ent-' + Math.random().toString(36).substring(7);
    const text = 'I lost my Aadhaar Card: 2000 1234 5678';
    const result = await service.assess(text, sess, 'LOST_MOBILE');
    expect(result.entities?.documentDetails).toBe('Aadhaar');
  });

  it('should extract vehicle details (plate number)', async () => {
    const sess = 'test-cie-ent-' + Math.random().toString(36).substring(7);
    const text = 'My bike UP32AB1234 was stolen';
    const result = await service.assess(text, sess, 'LOST_MOBILE');
    expect(result.entities?.vehicleDetails).toBe('Plate UP32AB1234');
  });
});
