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

async function runCxAuditTest() {
  console.log("=== STARTING CITIZEN EXPERIENCE (CX) QUALITY AUDIT TEST ===");
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
  // Force local fallback engine so we test the local rule templates
  httpService.post = () => throwError(() => new Error('Forced connection failure for CX testing')) as any;

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

  let score = 0;
  const sess = "cx-audit-sess-" + Math.random().toString(36).substring(7);

  try {
    // Stage 1: Greeting & Persona Checks
    console.log("\n--- Audit Stage 1: Greetings & Language ---");
    const r1 = await chatService.sendMessage("hello", sess);
    
    // Check if greeting contains officer badge emoji and welcome message
    if (r1.response.includes("👮") && r1.response.includes("preferred language")) {
      score += 10;
      console.log("[PASS] Greeting uses professional badge and language selector (+10 pts)");
    } else {
      console.error("[FAIL] Greeting lacks professional formatting / officer persona");
    }

    const r2 = await chatService.sendMessage("english", sess);
    if (r2.response.includes("assistance") || r2.response.includes("assist")) {
      score += 15;
      console.log("[PASS] Main menu greeting is professional (+15 pts)");
    }

    // Stage 2: Name and Mobile Collection with Reassurance
    console.log("\n--- Audit Stage 2: Profile Collection and Reassurance ---");
    const r3 = await chatService.sendMessage("File Complaint", sess);
    if (r3.response.includes("Before we begin") && r3.response.includes("name") && r3.response.includes("assist you properly")) {
      score += 15;
      console.log("[PASS] Name request contains clear reassurance (+15 pts)");
    } else {
      console.error("[FAIL] Name request is abrupt / robotic");
    }

    const r4 = await chatService.sendMessage("Sunil Dutt", sess);
    if (r4.response.includes("Sunil Dutt") && r4.response.includes("contact you regarding this request")) {
      score += 15;
      console.log("[PASS] Mobile request contains explaining reassurance (+15 pts)");
    } else {
      console.error("[FAIL] Mobile request lacks citizen explanation / reassurance");
    }

    // Stage 3: Incident Details & Empathy Check
    console.log("\n--- Audit Stage 3: Incident Details & Empathy Prefix ---");
    await chatService.sendMessage("9876543210", sess);
    await chatService.sendMessage("Noida", sess);
    const rConfirm = await chatService.sendMessage("Sector 15, Noida - 201301", sess);
    
    // Confirm details
    await chatService.sendMessage("action:PROFILE_CONFIRM", sess);
    
    // Select Lost Mobile Complaint type
    const rComplaintType = await chatService.sendMessage("Lost Mobile / Theft", sess);
    
    if (rComplaintType.response.includes("lost your mobile phone") && rComplaintType.response.includes("register the complaint")) {
      score += 20;
      console.log("[PASS] Lost mobile response prepends appropriate empathy context (+20 pts)");
    } else {
      console.error("[FAIL] Complaint subtype response does not prepend empathy");
    }

    // Stage 4: Submitting & Parity Audit
    console.log("\n--- Audit Stage 4: Submission and Tone Parity ---");
    await chatService.sendMessage("Apple", sess);
    await chatService.sendMessage("iPhone 15", sess);
    await chatService.sendMessage("Black", sess);
    await chatService.sendMessage("2024", sess);
    await chatService.sendMessage("skip", sess);
    await chatService.sendMessage("Noida Sector 62", sess);
    await chatService.sendMessage("10/06/2026", sess);
    const reviewRes = await chatService.sendMessage("Lost my iPhone near Metro Station Noida Sector 62.", sess);
    
    if (reviewRes.response.includes("review your application") && reviewRes.response.includes("Validation Status")) {
      score += 15;
      console.log("[PASS] Review screen contains validation status details (+15 pts)");
    }

    const submitRes = await chatService.sendMessage("action:SUBMIT_APPLICATION", sess);
    if (submitRes.response.includes("Reference Number") && submitRes.response.includes("concern") || submitRes.response.includes("submit") || submitRes.response.includes("concerned police unit")) {
      score += 10;
      console.log("[PASS] Success screen is informative and reassurance-centric (+10 pts)");
    }

  } catch (err) {
    console.error("Test execution failed with error:", err);
  }

  console.log(`\n=== CX AUDIT RESULT ===`);
  console.log(`Final CX Score: ${score}/100`);
  const passed = score >= 95;
  if (passed) {
    console.log("[SUCCESS] Rakku Citizen Experience audit PASSED (Score >= 95)");
  } else {
    console.error("[FAILED] Rakku Citizen Experience audit FAILED (Score < 95)");
  }
  process.exit(passed ? 0 : 1);
}

runCxAuditTest();
