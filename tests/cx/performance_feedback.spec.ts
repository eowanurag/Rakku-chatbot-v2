import { IntelligenceService } from '@backend/citizen-assistance/intelligence.service';
import { PrismaService } from '@backend/prisma.service';

describe('Performance Feedback Classification Test', () => {
  let intelligenceService: IntelligenceService;
  let prisma: PrismaService;

  beforeAll(() => {
    prisma = new PrismaService();
    intelligenceService = new IntelligenceService(prisma);
  });

  const phrases = [
    'slow',
    'lag',
    'delay',
    'response time',
    'performance',
    'loading',
    'takes too long',
    'slow response',
  ];

  phrases.forEach((phrase) => {
    it(`should classify "${phrase}" as PERFORMANCE`, () => {
      const result = intelligenceService.classifyFeedback(phrase);
      expect(result.category).toBe('PERFORMANCE');
    });

    it(`should classify uppercase "${phrase.toUpperCase()}" as PERFORMANCE`, () => {
      const result = intelligenceService.classifyFeedback(phrase.toUpperCase());
      expect(result.category).toBe('PERFORMANCE');
    });
  });
});
