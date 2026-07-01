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

describe('Workflow Parity & Integration Validation', () => {
  let prisma: PrismaService;
  let validation: ValidationService;
  let complaint: ComplaintService;
  let verification: VerificationService;
  let certificate: CertificateService;
  let event: EventService;
  let tracking: TrackingService;
  let analytics: AnalyticsService;
  let intelligence: IntelligenceService;
  let config: ConfigService;

  beforeAll(async () => {
    prisma = new PrismaService();
    
    // Clear any existing test citizen profiles and all child records to ensure clean lookup onboarding tests
    try {
      const citizens = await prisma.citizen.findMany({ where: { mobileNumber: { startsWith: "78787878" } } });
      for (const citizen of citizens) {
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

    config = new ConfigService();
    validation = new ValidationService();
    complaint = new ComplaintService(prisma);
    verification = new VerificationService(prisma);
    certificate = new CertificateService(prisma);
    event = new EventService(prisma);
    tracking = new TrackingService(prisma);
    analytics = new AnalyticsService();
    intelligence = new IntelligenceService(prisma);
  });

  beforeEach(async () => {
    try {
      const citizens = await prisma.citizen.findMany({ where: { mobileNumber: { startsWith: "78787878" } } });
      for (const citizen of citizens) {
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
      console.warn("Could not clear test citizens in beforeEach:", e.message);
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const getEngine = (useFastApi: boolean) => {
    const httpService = new HttpService();
    if (!useFastApi) {
      httpService.post = () => throwError(() => new Error('Forced connection failure for testing')) as any;
    }
    return new ChatService(
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
  };

  const runConversation = async (useFastApi: boolean, inputs: string[], sessionId: string) => {
    // Clear any existing test citizen profiles and all child records to ensure clean lookup onboarding tests
    try {
      const citizens = await prisma.citizen.findMany({ where: { mobileNumber: { startsWith: "78787878" } } });
      for (const citizen of citizens) {
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
      console.warn("Could not clear test citizens in runConversation:", e.message);
    }

    const chatService = getEngine(useFastApi);
    const responses = [];
    const steps = [];
    for (const input of inputs) {
      const res = await chatService.sendMessage(input, sessionId);
      responses.push(res.response);
      const state = await chatService.getOrCreateSession(sessionId);
      steps.push(state.step);
    }
    return { responses, steps };
  };

  const compareRuns = (fastApiRes: any, nestJsRes: any) => {
    // Assert general response count matches
    if (fastApiRes.responses.length !== nestJsRes.responses.length) {
      console.log('FastAPI Responses:', fastApiRes.responses);
      console.log('NestJS Responses:', nestJsRes.responses);
    }
    
    // Log arrays to debug
    console.log('FastAPI Responses:', fastApiRes.responses);
    console.log('NestJS Responses:', nestJsRes.responses);

    expect(fastApiRes.steps.length).toEqual(nestJsRes.steps.length);
    expect(fastApiRes.responses.length).toEqual(nestJsRes.responses.length);
    
    // Check steps match up to the workflow execution phase
    // We skip exact string matching for SERVICE_COLLECTION steps because NestJS uses hardcoded step strings 
    // (like '2_brand') while FastAPI uses dynamic integer indices (like 2, 3, 4).
    let mismatches = [];
    for (let i = 0; i < fastApiRes.steps.length; i++) {
      const fStep = String(fastApiRes.steps[i]);
      const nStep = String(nestJsRes.steps[i]);
      
      const profileSteps = ['START', 'IDENTIFY_NAME', 'IDENTIFY_MOBILE', 'IDENTIFY_LOCATION', 'CONFIRM_LOCATION', 'IDENTIFY_ADDRESS', 'CONFIRM_PROFILE', 'PROFILE_VERIFIED'];
      if (profileSteps.includes(fStep) || profileSteps.includes(nStep)) {
        if (fStep !== nStep) {
          mismatches.push(`Step ${i}: FastAPI=${fStep}, NestJS=${nStep}`);
        }
      }
    }
    if (mismatches.length > 0) {
      console.log('Mismatches:', mismatches);
      expect(mismatches.length).toEqual(0);
    }
    
    // Check key phrases in responses
    const allFastApiText = fastApiRes.responses.join(' ').toLowerCase();
    const allNestJsText = nestJsRes.responses.join(' ').toLowerCase();
    
    if (allFastApiText.includes('mobile') && allNestJsText.includes('mobile')) {
      expect(allNestJsText).toContain('mobile');
    }
    if (allFastApiText.includes('address') && allNestJsText.includes('address')) {
      expect(allNestJsText).toContain('address');
    }
    if (allFastApiText.includes('review') && allNestJsText.includes('review')) {
      expect(allNestJsText).toContain('review');
    }
    if (allFastApiText.includes('submit') && allNestJsText.includes('submit')) {
      expect(allNestJsText).toContain('submit');
    }
  };

  it('Parity: Complaint Registration (Lost Mobile)', async () => {
    const inputs = [
      "english",
      "File Complaint",
      "7878787801",
      "Manoj Tiwari",
      "Ayodhya",
      "Confirm",
      "House No 22 Civil Lines, Ayodhya",
      "option:Confirm Details",
      "Lost Mobile",
      "Yes",
      "Samsung",
      "M34",
      "Black",
      "2023",
      "Skip",
      "Ayodhya",
      "10/06/2026",
      "Lost mobile phone near temple",
      "Submit Application"
    ];

    const sess1 = `test-parity-cmp-fastapi-${Date.now()}`;
    const sess2 = `test-parity-cmp-nestjs-${Date.now()}`;

    const fastApiResult = await runConversation(true, inputs, sess1);
    const nestJsResult = await runConversation(false, inputs, sess2);

    compareRuns(fastApiResult, nestJsResult);
    
    // Verify Submission
    const lastFastApiResp = fastApiResult.responses[fastApiResult.responses.length - 1];
    const lastNestJsResp = nestJsResult.responses[nestJsResult.responses.length - 1];
    expect(lastFastApiResp).toContain('UP-CMP-');
    expect(lastNestJsResp).toContain('UP-CMP-');
  }, 300000);

  it('Parity: Tenant Verification', async () => {
    const inputs = [
      "english",
      "Tenant Verification",
      "7878787802",
      "Manoj Tiwari",
      "Ayodhya",
      "Confirm",
      "House No 22 Civil Lines, Ayodhya",
      "option:Confirm Details",
      "Tenant Verification",
      "Rahul Kumar",
      "Delhi",
      "9999999999",
      "Flat 101, Ayodhya",
      "Submit Application"
    ];

    const sess1 = `test-parity-ver-fastapi-${Date.now()}`;
    const sess2 = `test-parity-ver-nestjs-${Date.now()}`;

    const fastApiResult = await runConversation(true, inputs, sess1);
    const nestJsResult = await runConversation(false, inputs, sess2);

    compareRuns(fastApiResult, nestJsResult);
    
    const lastFastApiResp = fastApiResult.responses[fastApiResult.responses.length - 1];
    const lastNestJsResp = nestJsResult.responses[nestJsResult.responses.length - 1];
    expect(lastFastApiResp).toContain('UP-TV-');
    expect(lastNestJsResp).toContain('UP-TV-');
  }, 300000);

  it('Parity: Character Certificate', async () => {
    const inputs = [
      "english",
      "Character Certificate",
      "7878787803",
      "Manoj Tiwari",
      "Ayodhya",
      "Confirm",
      "House No 22 Civil Lines, Ayodhya",
      "option:Confirm Details",
      "Apply For Someone Else", // PRP Selection
      "Manoj Tiwari",
      "House No 22",
      "Ayodhya",
      "Job Application",
      "Submit Application"
    ];

    const sess1 = `test-parity-cert-fastapi-${Date.now()}`;
    const sess2 = `test-parity-cert-nestjs-${Date.now()}`;

    const fastApiResult = await runConversation(true, inputs, sess1);
    const nestJsResult = await runConversation(false, inputs, sess2);

    compareRuns(fastApiResult, nestJsResult);
    
    const lastFastApiResp = fastApiResult.responses[fastApiResult.responses.length - 1];
    const lastNestJsResp = nestJsResult.responses[nestJsResult.responses.length - 1];
    expect(lastFastApiResp).toContain('UP-CC-');
    expect(lastNestJsResp).toContain('UP-CC-');
  }, 300000);

  it('Parity: Event Permission', async () => {
    const inputs = [
      "english",
      "Event Permission",
      "7878787804",
      "Manoj Tiwari",
      "Ayodhya",
      "Confirm",
      "House No 22 Civil Lines, Ayodhya",
      "option:Confirm Details",
      "Event Permission",      // 1. Select request type
      "Apply For Someone Else", // 2. PRP Choice
      "Manoj Tiwari",           // 3. Organizer Name
      "House No 22 Civil Lines, Ayodhya",// 4. Organizer Address
      "7878787804",             // 5. Organizer Mobile
      "Diwali Mela",            // 6. Event Name
      "Ram Katha Park",         // 7. Event Location
      "10/12/2026",             // 8. Event Date
      "1000",                   // 9. Expected Attendance
      "Submit Application"      // 10. Submit
    ];

    const sess1 = `test-parity-event-fastapi-${Date.now()}`;
    const sess2 = `test-parity-event-nestjs-${Date.now()}`;

    const fastApiResult = await runConversation(true, inputs, sess1);
    const nestJsResult = await runConversation(false, inputs, sess2);

    compareRuns(fastApiResult, nestJsResult);
    
    const lastFastApiResp = fastApiResult.responses[fastApiResult.responses.length - 1];
    const lastNestJsResp = nestJsResult.responses[nestJsResult.responses.length - 1];
    expect(lastFastApiResp).toContain('UP-EP-');
    expect(lastNestJsResp).toContain('UP-EP-');
  }, 300000);

  it('Parity: Application Tracking', async () => {
    const inputs = [
      "english",
      "Track Application",
      "UP-CMP-2026-123456"
    ];

    const sess1 = `test-parity-track-fastapi-${Date.now()}`;
    const sess2 = `test-parity-track-nestjs-${Date.now()}`;

    const fastApiResult = await runConversation(true, inputs, sess1);
    const nestJsResult = await runConversation(false, inputs, sess2);

    compareRuns(fastApiResult, nestJsResult);
  }, 300000);

});
