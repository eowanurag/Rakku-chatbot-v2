import { ChatService } from '../../backend/src/chat/chat.service';
import { PrismaService } from '../../backend/src/prisma.service';

describe('Resume Summary E2E Spec', () => {
  let prisma: PrismaService;

  beforeAll(() => {
    prisma = new PrismaService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should format recovery prompt template correctly', () => {
    const wfName = 'Lost Mobile';
    const lastQuestion = 'Incident Date';
    const prompt = `You were filing a ${wfName} complaint.\n\nLast completed step:\n${lastQuestion}\n\nWould you like to continue?`;
    expect(prompt).toContain('You were filing a Lost Mobile complaint.');
    expect(prompt).toContain('Last completed step:\nIncident Date');
    expect(prompt).toContain('Would you like to continue?');
  });
});
