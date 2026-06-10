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

async function runWorkflowParityTest() {
  console.log("=== STARTING WORKFLOW PARITY TEST (NESTJS FALLBACK ENGINE) ===");
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
  // Force local fallback engine by throwing error on http request
  httpService.post = () => throwError(() => new Error('Forced connection failure for parity testing')) as any;

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
    // 1. Complaint Workflow Test
    console.log("\n--- Testing Complaint Workflow (Lost Mobile) ---");
    const sess1 = "parity-comp-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", sess1);
    await chatService.sendMessage("english", sess1);
    await chatService.sendMessage("Lost Mobile / Theft", sess1);
    await chatService.sendMessage("Amit Sharma", sess1);
    await chatService.sendMessage("9876543210", sess1);
    await chatService.sendMessage("Kanpur", sess1);
    await chatService.sendMessage("123, Civil Lines, Kanpur - 208001", sess1);
    await chatService.sendMessage("yes", sess1); // confirm profile
    
    // Now in complaint details
    await chatService.sendMessage("Samsung", sess1); // Brand
    await chatService.sendMessage("Galaxy S23", sess1); // Model
    await chatService.sendMessage("Black", sess1); // Color
    await chatService.sendMessage("2023", sess1); // Year
    const imeiPrompt = await chatService.sendMessage("skip", sess1); // IMEI skip
    assert(imeiPrompt.response.includes("where the incident occurred"), "Should ask for incident location next");
    
    await chatService.sendMessage("Mall Road, Kanpur", sess1); // Location
    await chatService.sendMessage("10/05/2026", sess1); // Date
    const reviewRes = await chatService.sendMessage("My phone was stolen while shopping.", sess1); // Description -> REVIEW
    
    assert(reviewRes.response.includes("Device Information"), "Review screen should show Device Information header");
    assert(reviewRes.response.includes("IMEI: **Not Provided**"), "Review screen should show IMEI as Not Provided");
    assert(reviewRes.response.includes("Submit Application"), "Review screen should offer Submit option");

    const submitRes = await chatService.sendMessage("Submit Application", sess1);
    assert(submitRes.response.includes("UP-CMP-"), "Should receive a complaint reference number starting with UP-CMP-");

    // 2. Verification Workflow Test
    console.log("\n--- Testing Tenant Verification Workflow ---");
    const sess2 = "parity-ver-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", sess2);
    await chatService.sendMessage("english", sess2);
    await chatService.sendMessage("Tenant Verification", sess2);
    await chatService.sendMessage("Vijay Kumar", sess2);
    await chatService.sendMessage("9123456789", sess2);
    await chatService.sendMessage("Noida", sess2);
    await chatService.sendMessage("Sec 62, Noida - 201301", sess2);
    await chatService.sendMessage("yes", sess2); // confirm profile

    // Verification steps
    await chatService.sendMessage("Tenant", sess2); // type
    await chatService.sendMessage("Rohan Gupta", sess2); // tenant name
    await chatService.sendMessage("Flat 402, Block C, Noida", sess2); // tenant address
    await chatService.sendMessage("9898989898", sess2); // tenant mobile
    const verReview = await chatService.sendMessage("Residential flat tenant lease", sess2); // property details -> REVIEW
    assert(verReview.response.includes("Candidate Name"), "Review screen should show Candidate Name");
    assert(verReview.response.includes("Submit Application"), "Review screen should offer Submit");

    const verSubmit = await chatService.sendMessage("Submit Application", sess2);
    assert(verSubmit.response.includes("UP-TV-"), "Should receive a tracking number starting with UP-TV-");

    // 3. Event Permission Workflow Test
    console.log("\n--- Testing Event Permission Workflow ---");
    const sess3 = "parity-evt-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", sess3);
    await chatService.sendMessage("english", sess3);
    await chatService.sendMessage("Event Permission", sess3);
    await chatService.sendMessage("Rajesh Roy", sess3);
    await chatService.sendMessage("8888777766", sess3);
    await chatService.sendMessage("Lucknow", sess3);
    await chatService.sendMessage("Gomti Nagar, Lucknow - 226010", sess3);
    await chatService.sendMessage("yes", sess3); // confirm profile

    // Event steps
    await chatService.sendMessage("Event Permission", sess3); // type
    await chatService.sendMessage("Dussehra Festival", sess3); // event name
    await chatService.sendMessage("Ramleela Ground, Lucknow", sess3); // venue
    await chatService.sendMessage("25/10/2026", sess3); // date
    const evtReview = await chatService.sendMessage("1000", sess3); // attendance -> REVIEW
    assert(evtReview.response.includes("Expected Attendance Valid"), "Review screen validation checklist should show expected attendance valid");

    const evtSubmit = await chatService.sendMessage("Submit Application", sess3);
    assert(evtSubmit.response.includes("UP-EP-"), "Should receive a tracking number starting with UP-EP-");

    // 4. Tracking Workflow Test
    console.log("\n--- Testing Tracking Workflow with Format checks ---");
    const sess4 = "parity-track-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", sess4);
    await chatService.sendMessage("english", sess4);
    
    // Test invalid reference format
    const trackStart = await chatService.sendMessage("Track status", sess4);
    assert(trackStart.response.includes("Application Reference Number"), "Should prompt for reference number");
    
    const badTrack = await chatService.sendMessage("INVALID-1234", sess4);
    assert(badTrack.response.includes("format appears invalid"), "Should warning format is invalid");

  } catch (err) {
    console.error("Test execution failed with error:", err);
    failedTests++;
  }

  console.log(`\n=== TEST SUMMARY ===`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  process.exit(failedTests > 0 ? 1 : 0);
}

runWorkflowParityTest();
