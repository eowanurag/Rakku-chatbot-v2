import { ChatService } from './chat.service';
import { PrismaService } from '../prisma.service';
import { ValidationService } from './validation.service';
import { ComplaintService } from '../complaint/complaint.service';
import { VerificationService } from '../verification/verification.service';
import { CertificateService } from '../certificate/certificate.service';
import { EventService } from '../event/event.service';
import { TrackingService } from '../tracking/tracking.service';
import { AnalyticsService } from '../citizen-assistance/analytics.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { IntelligenceService } from '../citizen-assistance/intelligence.service';
import { throwError } from 'rxjs';

async function runStabilityTest() {
  console.log("=== STARTING STABILITY REGRESSION TEST SUITE ===");
  const prisma = new PrismaService();
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
  httpService.post = () => throwError(() => new Error('Forced connection failure for stability testing')) as any;

  const chatService = new ChatService(
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

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      passedTests++;
      console.log(`[PASS] ${message}`);
    } else {
      failedTests++;
      console.error(`[FAIL] ${message}`);
    }
  }

  try {
    const sess = "stability-sess-" + Math.random().toString(36).substring(7);

    // 1. Test _debug field visibility
    console.log("\n--- Testing _debug Field ---");
    const helloRes = await chatService.sendMessage("hello", sess);
    assert(helloRes._debug !== undefined, "Response should contain _debug info");
    assert(helloRes._debug.activeEngine === 'FALLBACK', "Active engine in _debug should be FALLBACK");

    // 2. Test trace logging (Check AuditLog in DB)
    console.log("\n--- Testing Workflow Trace Logging ---");
    const latestLog = await prisma.auditLog.findFirst({
      where: { sessionId: sess },
      orderBy: { createdAt: 'desc' },
    });
    assert(latestLog !== null, "AuditLog entry should be written for message transition");
    if (latestLog) {
      const data = latestLog.eventData as any;
      assert(data.engine === 'FALLBACK', "AuditLog eventData should register engine as FALLBACK");
    }

    // 3. Test Action Button Routing
    console.log("\n--- Testing Action Button Handling ---");
    // Advance workflow session to identification profile
    await chatService.sendMessage("english", sess);
    await chatService.sendMessage("File Complaint", sess);
    await chatService.sendMessage("Rahul Roy", sess);
    await chatService.sendMessage("9988776655", sess);
    await chatService.sendMessage("Kanpur", sess);
    const confirmationPrompt = await chatService.sendMessage("Sector 1, Kanpur - 208002", sess);
    assert(confirmationPrompt.response.includes("Please review your details"), "Should reach profile confirmation screen");

    // Send action:PROFILE_CONFIRM payload
    const confirmRes = await chatService.sendMessage("action:PROFILE_CONFIRM", sess);
    assert(confirmRes.response.includes("Citizen Profile Verified"), "action:PROFILE_CONFIRM should verify profile");

    // 4. Test Reference Number Normalization
    console.log("\n--- Testing Reference Number Normalization & Validation ---");
    const trackSess = "track-norm-sess-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", trackSess);
    await chatService.sendMessage("english", trackSess);
    await chatService.sendMessage("Track status", trackSess);
    
    // Spaces, tabs, and mixed casing in reference number
    const normalTrackRes = await chatService.sendMessage("  up-cmp   2026  123456  ", trackSess);
    assert(normalTrackRes.response.includes("No application found"), "Normalized reference number should perform tracking query, returning 'No application found' instead of format warning");

    // 5. Test Dead-End Detection
    console.log("\n--- Testing Dead-End Detection ---");
    // Mock runComplaintWorkflow to return an invalid/empty result
    const originalRunComplaintWorkflow = (chatService as any).runComplaintWorkflow;
    (chatService as any).runComplaintWorkflow = async () => {
      return { response: 'Invalid step' };
    };

    const deadEndSess = "dead-end-sess-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", deadEndSess);
    await chatService.sendMessage("english", deadEndSess);
    await chatService.sendMessage("File Complaint", deadEndSess);
    await chatService.sendMessage("Test User", deadEndSess);
    await chatService.sendMessage("9111222333", deadEndSess);
    await chatService.sendMessage("Lucknow", deadEndSess);
    await chatService.sendMessage("Gomti Nagar, Lucknow - 226010", deadEndSess);
    await chatService.sendMessage("action:PROFILE_CONFIRM", deadEndSess); // should route to runComplaintWorkflow returning 'Invalid step'

    // The handler returns 'Invalid step' which should trigger dead-end detection and reset step to START
    const deadEndResponse = await chatService.sendMessage("Some message", deadEndSess);
    assert(deadEndResponse.response.includes("encountered an issue processing your request"), "Dead-end detection should trigger starting over prompt");
    
    const restoredSession = await chatService.getOrCreateSession(deadEndSess);
    assert(restoredSession.step === 'START', "Session step should be reset to START on dead-end detection");

    // Restore original method
    (chatService as any).runComplaintWorkflow = originalRunComplaintWorkflow;

  } catch (err) {
    console.error("Test execution failed with error:", err);
    failedTests++;
  }

  console.log(`\n=== STABILITY TEST SUMMARY ===`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  process.exit(failedTests > 0 ? 1 : 0);
}

runStabilityTest();
