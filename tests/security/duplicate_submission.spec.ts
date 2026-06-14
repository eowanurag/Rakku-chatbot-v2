import { PrismaService } from '@backend/prisma.service';
import { ComplaintService } from '@backend/complaint/complaint.service';
import { CertificateService } from '@backend/certificate/certificate.service';
import { EventService } from '@backend/event/event.service';
import { IntelligenceService } from '@backend/citizen-assistance/intelligence.service';
import { SubmissionFingerprintService } from '@backend/security/submission-fingerprint.service';

describe('Duplicate Submission Prevention Spec', () => {
  let prisma: PrismaService;
  let fingerprintService: SubmissionFingerprintService;
  let complaintService: ComplaintService;
  let certificateService: CertificateService;
  let eventService: EventService;
  let intelligenceService: IntelligenceService;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    // Clear fingerprints for clean test
    await prisma.submissionFingerprint.deleteMany({});
    
    fingerprintService = new SubmissionFingerprintService(prisma);
    complaintService = new ComplaintService(prisma, fingerprintService);
    certificateService = new CertificateService(prisma, fingerprintService);
    eventService = new EventService(prisma, fingerprintService);
    intelligenceService = new IntelligenceService(prisma, fingerprintService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should block duplicate complaints', async () => {
    const type = 'Theft';
    const details = 'My mobile phone was stolen at Hazratganj';
    
    // First submission
    const res1 = await complaintService.createComplaint(type, details);
    expect(res1.referenceNumber).toBeDefined();

    // Second submission (duplicate) within 5 minutes should throw duplicate error
    await expect(complaintService.createComplaint(type, details))
      .rejects.toThrow('Duplicate submission detected');
  });

  it('should block duplicate certificates', async () => {
    const name = 'Ravi Kumar';
    const address = 'Sector 5 Gomti Nagar';
    const district = 'LUCKNOW';
    const purpose = 'Job Verification';

    // First submission
    const res1 = await certificateService.createCertificate(name, address, district, purpose);
    expect(res1.referenceNumber).toBeDefined();

    // Second submission
    await expect(certificateService.createCertificate(name, address, district, purpose))
      .rejects.toThrow('Duplicate submission detected');
  });

  it('should block duplicate events', async () => {
    const type = 'Festival';
    const eventName = 'Ram Lila Celebration';
    const location = 'Gomti Nagar Ramlila Ground';
    const date = '2026-10-12';
    const attendance = 500;

    // First submission
    const res1 = await eventService.createEventPermission(type, eventName, location, date, attendance);
    expect(res1.referenceNumber).toBeDefined();

    // Second submission
    await expect(eventService.createEventPermission(type, eventName, location, date, attendance))
      .rejects.toThrow('Duplicate submission detected');
  });

  it('should block duplicate feedback', async () => {
    const sessionId = 'duplicate-fb-session-id';
    const rating = 5;
    const comments = 'Excellent support performance';

    // First submission
    await intelligenceService.saveFeedback(sessionId, null, null, rating, comments);

    // Second submission
    await expect(intelligenceService.saveFeedback(sessionId, null, null, rating, comments))
      .rejects.toThrow('Duplicate submission detected');
  });
});
