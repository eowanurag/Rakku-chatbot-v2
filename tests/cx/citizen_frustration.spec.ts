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

describe('Citizen Frustration Test', () => {
  let chatService: ChatService;
  let prisma: PrismaService;

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
    // Force local fallback engine
    httpService.post = () => throwError(() => new Error('Forced connection failure for frustration testing')) as any;

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
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should handle citizen frustration gracefully and maintain state', async () => {
    const sess = "frust-sess-" + Math.random().toString(36).substring(7);

    // Initialize session to profile lookup
    await chatService.sendMessage("hello", sess);
    await chatService.sendMessage("english", sess);
    
    // Send File Complaint which prompts for Mobile Number
    const mobilePrompt = await chatService.sendMessage("File Complaint", sess);
    expect(mobilePrompt.response).toContain("Mobile Number");

    // 1. Test "why do you need" frustration trigger during mobile collection
    const rWhyMobile = await chatService.sendMessage("why do you need my mobile number?", sess);
    expect(rWhyMobile.response).toContain("As a digital assistant, I require this information to comply with official UP Police records");
    expect(rWhyMobile.response).toContain("Mobile Number");

    // Send mobile number to advance to Name collection
    const namePrompt = await chatService.sendMessage("9876543210", sess);
    expect(namePrompt.response).toContain("Before we begin, may I know your name");

    // Test "why do you need" frustration trigger during name collection
    const rWhyName = await chatService.sendMessage("why do you need my name?", sess);
    expect(rWhyName.response).toContain("As a digital assistant, I require this information to comply with official UP Police records");
    expect(rWhyName.response).toContain("Before we begin, may I know your name");

    // Send name to advance to Location collection
    await chatService.sendMessage("Ram Charan", sess);

    // 2. Test "I don't know" during location collection
    const rDontKnow = await chatService.sendMessage("i don't know", sess);
    expect(rDontKnow.response).toContain("That is no problem. If you do not have this information");
    expect(rDontKnow.response).toContain("city, district, or area");

    // Send location to advance to location confirmation
    await chatService.sendMessage("Noida", sess);

    // 3. Test "I already told you" during location confirmation
    const rAlreadyTold = await chatService.sendMessage("i already told you my address is Noida", sess);
    expect(rAlreadyTold.response).toContain("Thank you for your patience. I have preserved the details");
    expect(rAlreadyTold.response).toContain("Is this correct");

    // Confirm location to advance to Address collection
    await chatService.sendMessage("Confirm", sess);

    // 4. Test "explain this" during address collection
    const rExplain = await chatService.sendMessage("explain what this is", sess);
    expect(rExplain.response).toContain("I am here to assist you. This is an official digital helpdesk");
    expect(rExplain.response).toContain("complete address");
  });
});
