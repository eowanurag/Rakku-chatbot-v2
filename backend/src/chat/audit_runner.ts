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

import { SubmissionFingerprintService } from '../security/submission-fingerprint.service';

async function runAudit() {
  console.log("Starting Rakku master audit simulation...");
  const prisma = new PrismaService();
  const fingerprint = new SubmissionFingerprintService(prisma);
  const config = new ConfigService();
  const validation = new ValidationService();
  const complaint = new ComplaintService(prisma, fingerprint);
  const verification = new VerificationService(prisma);
  const certificate = new CertificateService(prisma, fingerprint);
  const event = new EventService(prisma, fingerprint);
  const tracking = new TrackingService(prisma);
  const intelligence = new IntelligenceService(prisma, fingerprint);
  const analytics = new AnalyticsService();
  const httpService = new HttpService();
  
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

  const sessionId = "audit-session-" + Math.random().toString(36).substring(7);

  // Helper
  const send = async (msg: string) => {
    const res = await chatService.sendMessage(msg, sessionId);
    console.log(`\nUser: "${msg}"`);
    console.log(`Rakku: "${res.response.substring(0, 160)}..."`);
    return res;
  };

  try {
    // CATEGORY 1: Onboarding
    await send("hello");
    // Select Language
    await send("english");
    // CATEGORY 3: Single Name Support
    await send("Rahul");
    // CATEGORY 5: Mobile Validation
    await send("9876543210");
    // CATEGORY 7/10: Location Modification & Incomplete Location check
    await send("I live near Civil Lines");
    await send("Lucknow");
    // Confirm Location
    await send("yes");
    // Address
    await send("Hazratganj, Lucknow");
    // Confirm Profile
    await send("yes");
    // Start workflow
    await send("My phone was stolen");

    console.log("\nAudit Script Simulation completed successfully!");
  } catch (error) {
    console.error("Audit Simulation failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runAudit();
