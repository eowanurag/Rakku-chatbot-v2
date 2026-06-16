import { PrismaService } from '@backend/prisma.service';

describe('Supabase Database Concurrent Load Performance Spec', () => {
  let prisma: PrismaService;

  beforeAll(() => {
    jest.setTimeout(60000);
    prisma = new PrismaService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const runConcurrentRequests = async (concurrencyCount: number) => {
    const start = Date.now();
    
    // Create query promises
    const promises = Array.from({ length: concurrencyCount }, (_, i) => {
      // Run simple cheap query to stress connection pool
      return prisma.$queryRaw`SELECT ${i} as worker_id`;
    });

    const results = await Promise.all(promises);
    const duration = Date.now() - start;

    expect(results.length).toBe(concurrencyCount);
    results.forEach((res: any, idx) => {
      expect(Number(res[0].worker_id)).toBe(idx);
    });

    console.log(`Concurrency load of ${concurrencyCount} requests took ${duration}ms`);
    return duration;
  };

  it('should handle 10 concurrent database queries successfully', async () => {
    const duration = await runConcurrentRequests(10);
    expect(duration).toBeLessThan(10000); // Should be well within 10s
  }, 15000);

  it('should handle 50 concurrent database queries successfully', async () => {
    const duration = await runConcurrentRequests(50);
    expect(duration).toBeLessThan(20000); // Should be well within 20s
  }, 25000);

  it('should handle 100 concurrent database queries successfully', async () => {
    const duration = await runConcurrentRequests(100);
    expect(duration).toBeLessThan(35000); // Should be well within 35s
  }, 40000);
});
