import { ChatService } from '@backend/chat/chat.service';
import { PrismaService } from '@backend/prisma.service';
import { ValidationService } from '@backend/chat/validation.service';
import { ComplaintService } from '@backend/complaint/complaint.service';
import { VerificationService } from '@backend/verification/verification.service';
import { CertificateService } from '@backend/certificate/certificate.service';
import { EventService } from '@backend/event/event.service';
import { TrackingService } from '@backend/tracking/tracking.service';
import { AnalyticsService } from '@backend/citizen-assistance/analytics.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { IntelligenceService } from '@backend/citizen-assistance/intelligence.service';
import { throwError } from 'rxjs';

describe('Citizen Experience (CX) Quality Audit Test', () => {
  let chatService: ChatService;
  let prisma: PrismaService;
  let sess: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    
    // Clear any existing test citizen profiles and all child records to ensure clean lookup onboarding tests
    try {
      const citizen = await prisma.citizen.findFirst({ where: { mobileNumber: "9876543210" } });
      if (citizen) {
        const cid = citizen.id;
        await prisma.complaint.deleteMany({ where: { citizenId: cid } });
        await prisma.verification.deleteMany({ where: { citizenId: cid } });
        await prisma.characterCertificate.deleteMany({ where: { citizenId: cid } });
        await prisma.eventPermission.deleteMany({ where: { citizenId: cid } });
        await prisma.notification.deleteMany({ where: { citizenId: cid } });
        await prisma.workflowSession.deleteMany({ where: { citizenId: cid } });
        await prisma.citizen.delete({ where: { id: cid } });
      }
    } catch (e) {
      console.warn("Could not clear test citizens:", e.message);
    }

    const config = new ConfigService();
    const validation = new ValidationService();
    const complaint = new ComplaintService(prisma);
    const verification = new VerificationService(prisma);
    const certificate = new CertificateService(prisma);
    const event = new EventService(prisma);
    const tracking = new TrackingService(prisma);
    const intelligence = new IntelligenceService(prisma);
    const analytics = new AnalyticsService();
    
    const httpService = new HttpService();
    // Force local fallback engine so we test the local rule templates
    httpService.post = () => throwError(() => new Error('Forced connection failure for CX testing')) as any;

    chatService = new ChatService(
      httpService,
      config,
      complaint,
      verification,
      certificate,
      event,
      tracking,
      analytics,
      prisma,
      validation,
      intelligence
    );
    sess = "cx-audit-sess-" + Math.random().toString(36).substring(7);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Stage 1: Greeting & Persona Checks', async () => {
    const r1 = await chatService.sendMessage("hello", sess);
    expect(r1.response).toContain("👮");
    expect(r1.response).toContain("preferred language");

    const r2 = await chatService.sendMessage("english", sess);
    expect(r2.response).toMatch(/assistance|assist/);
  });

  it('Stage 2: Profile Collection and Reassurance', async () => {
    const r3 = await chatService.sendMessage("File Complaint", sess);
    expect(r3.response).toContain("Mobile Number");

    const rNameRequest = await chatService.sendMessage("9876543210", sess);
    expect(rNameRequest.response).toContain("Before we begin");
    expect(rNameRequest.response).toContain("name");
    expect(rNameRequest.response).toContain("assist you properly");

    const rLocationRequest = await chatService.sendMessage("Sunil Dutt", sess);
    expect(rLocationRequest.response).toContain("city, district, or area");
  });

  it('Stage 3: Incident Details & Empathy Check', async () => {
    await chatService.sendMessage("Noida", sess);
    await chatService.sendMessage("Confirm", sess);
    await chatService.sendMessage("Sector 15, Noida - 201301", sess);
    await chatService.sendMessage("option:Confirm Details", sess);
    
    // Select Lost Mobile Complaint type
    await chatService.sendMessage("Lost Mobile / Theft", sess);
    const rComplaintType = await chatService.sendMessage("Yes", sess);
    
    expect(rComplaintType.response).toContain("lost your mobile phone");
    expect(rComplaintType.response).toContain("register the complaint");
  });

  it('Stage 4: Submission and Tone Parity', async () => {
    await chatService.sendMessage("Apple", sess);
    await chatService.sendMessage("iPhone 15", sess);
    await chatService.sendMessage("Black", sess);
    await chatService.sendMessage("2024", sess);
    await chatService.sendMessage("skip", sess);
    await chatService.sendMessage("Noida Sector 62", sess);
    await chatService.sendMessage("10/06/2026", sess);
    
    const reviewRes = await chatService.sendMessage("Lost my iPhone near Metro Station Noida Sector 62.", sess);
    expect(reviewRes.response).toContain("review your application");
    expect(reviewRes.response).toContain("Validation Status");

    const submitRes = await chatService.sendMessage("action:SUBMIT_APPLICATION", sess);
    expect(submitRes.response).toContain("Reference Number");
    expect(submitRes.response).toMatch(/concern|submit|concerned police unit/);
  });
});
