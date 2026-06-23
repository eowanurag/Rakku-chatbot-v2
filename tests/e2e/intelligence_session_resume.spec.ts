import { ChatService } from '../../backend/src/chat/chat.service';
import { PrismaService } from '../../backend/src/prisma.service';

jest.setTimeout(30000);

describe('E2E Session Resume Recovery', () => {
  let chatService: ChatService;
  let prisma: PrismaService;

  beforeAll(() => {
    prisma = new PrismaService();
    chatService = new ChatService(
      { post: () => { throw new Error('Mock AI error') } } as any,
      { get: () => 'http://localhost:8000' } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { trackHelpRequest: () => {} } as any,
      prisma,
      { sanitizeInput: (x: any) => x, sanitizeOutput: (x: any) => x } as any,
      { logInsight: () => {}, logSentiment: () => {}, saveCitizenPreferences: () => {} } as any
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should restore previous state details upon reload', async () => {
    const sess = 'sess-resume-' + Math.random().toString(36).substring(7);
    const mockState = {
      workflow: 'complaint' as any,
      step: 'COLLECTING',
      data: { type: 'Lost Mobile / Theft' },
      language: 'en' as any,
      languageSelected: true,
      citizen: { fullName: 'Amit', mobileNumber: '9876543210', email: '', city: 'Lucknow', district: 'Lucknow', state: 'Uttar Pradesh', isConfirmed: true } as any
    };

    await chatService.saveSession(sess, mockState);
    const retrieved = await chatService.getOrCreateSession(sess);
    expect(retrieved.citizen.fullName).toBe('Amit');
  });
});
