import { SubmissionFingerprintService } from '@backend/security/submission-fingerprint.service';
import { PrismaService } from '@backend/prisma.service';

describe('Submission Fingerprint Lifecycle Spec', () => {
  jest.setTimeout(30000);
  let fingerprintService: SubmissionFingerprintService;
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    fingerprintService = new SubmissionFingerprintService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should verify SHA256 hashing consistency', () => {
    const payload = { details: 'Lost my wallet', category: 'Theft' };
    const fp1 = fingerprintService.generateFingerprint('citizen-123', 'Complaint', payload);
    const fp2 = fingerprintService.generateFingerprint('citizen-123', 'Complaint', payload);
    expect(fp1).toBe(fp2);
    expect(fp1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should normalize payloads consistently, stripping dynamic metadata', () => {
    const payload1 = {
      details: 'Lost my wallet',
      sessionId: 'sess-abc-123',
      timestamp: Date.now(),
      createdAt: new Date(),
    };
    const payload2 = {
      details: 'Lost my wallet',
      sessionId: 'sess-xyz-789',
      timestamp: Date.now() + 1000,
      createdAt: new Date(Date.now() - 5000),
    };

    const fp1 = fingerprintService.generateFingerprint('citizen-123', 'Complaint', payload1);
    const fp2 = fingerprintService.generateFingerprint('citizen-123', 'Complaint', payload2);
    expect(fp1).toBe(fp2);
  });

  it('should accurately detect duplicate submissions within 5 minutes and prune old ones during cleanup', async () => {
    const citizenId = 'citizen-temp';
    const payload = { item: 'bag', color: 'red' };
    const fp = fingerprintService.generateFingerprint(citizenId, 'Complaint', payload);

    // Clean any prior instances of this fingerprint
    await prisma.submissionFingerprint.deleteMany({ where: { fingerprint: fp } });

    // Initial check: should not be duplicate
    let isDup = await fingerprintService.isDuplicate(fp, 'Complaint');
    expect(isDup).toBe(false);

    // Record it
    await fingerprintService.recordFingerprint(fp, citizenId, 'Complaint');

    // Second check: should detect duplicate
    isDup = await fingerprintService.isDuplicate(fp, 'Complaint');
    expect(isDup).toBe(true);

    // Let's create an old record manually to test cleanup
    const oldFp = 'old-fingerprint-hash-val-123';
    await prisma.submissionFingerprint.deleteMany({ where: { fingerprint: oldFp } });

    await prisma.submissionFingerprint.create({
      data: {
        fingerprint: oldFp,
        citizenId,
        serviceType: 'Complaint',
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      },
    });

    // Run cleanup
    const count = await fingerprintService.cleanupFingerprints();
    expect(count).toBeGreaterThanOrEqual(1);

    // Verify old fingerprint is deleted
    const oldRecord = await prisma.submissionFingerprint.findUnique({
      where: { fingerprint: oldFp },
    });
    expect(oldRecord).toBeNull();

    // Verify recent fingerprint is not deleted
    const recentRecord = await prisma.submissionFingerprint.findUnique({
      where: { fingerprint: fp },
    });
    expect(recentRecord).not.toBeNull();

    // Cleanup recent
    await prisma.submissionFingerprint.delete({ where: { fingerprint: fp } });
  });
});
