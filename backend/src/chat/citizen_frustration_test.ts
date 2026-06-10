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

async function runCitizenFrustrationTest() {
  console.log("=== STARTING CITIZEN FRUSTRATION STABILITY TEST ===");
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
  httpService.post = () => throwError(() => new Error('Forced connection failure for frustration testing')) as any;

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

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      passed++;
      console.log(`[PASS] ${message}`);
    } else {
      failed++;
      console.error(`[FAIL] ${message}`);
    }
  }

  try {
    const sess = "frust-sess-" + Math.random().toString(36).substring(7);

    // Initialize session to profile name collection
    await chatService.sendMessage("hello", sess);
    await chatService.sendMessage("english", sess);
    const namePrompt = await chatService.sendMessage("File Complaint", sess);
    assert(namePrompt.response.includes("Before we begin, may I know your name"), "Should prompt for citizen name");

    // 1. Test "why do you need" frustration trigger during name collection
    console.log("\n--- Scenario 1: 'Why do you need' ---");
    const rWhy = await chatService.sendMessage("why do you need my name?", sess);
    assert(rWhy.response.includes("As a digital assistant, I require this information to comply with official UP Police records"), "Should display FRUSTRATION_WHY_NEEDED explanation");
    assert(rWhy.response.includes("Before we begin, may I know your name"), "Should re-prompt name collection");

    // Send name to advance
    await chatService.sendMessage("Ram Charan", sess);

    // 2. Test "I don't know" during mobile collection
    console.log("\n--- Scenario 2: 'I don't know' ---");
    const rDontKnow = await chatService.sendMessage("i don't know", sess);
    assert(rDontKnow.response.includes("That is no problem. If you do not have this information"), "Should display FRUSTRATION_DONT_KNOW text");
    assert(rDontKnow.response.includes("share your mobile number"), "Should re-prompt mobile number request");

    // Send mobile to advance
    await chatService.sendMessage("9898989898", sess);

    // 3. Test "I already told you" during location collection
    console.log("\n--- Scenario 3: 'I already told you' ---");
    const rAlreadyTold = await chatService.sendMessage("i already told you my address is Noida", sess);
    assert(rAlreadyTold.response.includes("Thank you for your patience. I have preserved the details"), "Should display FRUSTRATION_ALREADY_TOLD text");
    assert(rAlreadyTold.response.includes("city, district, or area"), "Should re-prompt location prompt");

    // 4. Test "explain this" during location confirmation
    console.log("\n--- Scenario 4: 'explain this' ---");
    await chatService.sendMessage("Noida", sess);
    const rExplain = await chatService.sendMessage("explain what this is", sess);
    assert(rExplain.response.includes("I am here to assist you. This is an official digital helpdesk"), "Should display FRUSTRATION_EXPLAIN_TERM text");
    assert(rExplain.response.includes("I found your location as Noida"), "Should re-prompt location confirmation");

  } catch (err) {
    console.error("Test execution failed with error:", err);
    failed++;
  }

  console.log(`\n=== CITIZEN FRUSTRATION STABILITY SUMMARY ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runCitizenFrustrationTest();
