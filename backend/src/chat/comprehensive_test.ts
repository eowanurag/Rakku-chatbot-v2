import { ChatService } from './chat.service';
import { PrismaService } from '../prisma.service';
import { ValidationService } from './validation.service';
import { ComplaintService } from '../workflows/complaint/complaint.service';
import { VerificationService } from '../workflows/verification/verification.service';
import { CertificateService } from '../workflows/certificate/certificate.service';
import { EventService } from '../workflows/event/event.service';
import { TrackingService } from '../workflows/tracking/tracking.service';
import { AnalyticsService } from '../citizen-assistance/analytics.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { IntelligenceService } from '../citizen-assistance/intelligence.service';
import { SubmissionFingerprintService } from '../security/submission-fingerprint.service';
import * as fs from 'fs';
import * as path from 'path';

async function runBugDiscoveryAudit() {
  console.log("=== STARTING RAKKU BUG DISCOVERY & COMPREHENSIVE QA AUDIT ===");
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

  const bugs: Array<{
    id: string;
    suite: string;
    description: string;
    severity: string;
    rootCause: string;
    suggestedFix: string;
    dbImpact: string;
    userImpact: string;
    input: string;
    response: string;
  }> = [];

  const addBug = (suiteId: string, suiteName: string, desc: string, severity: string, cause: string, fix: string, dbImp: string, userImp: string, input: string, res: string) => {
    bugs.push({
      id: suiteId,
      suite: suiteName,
      description: desc,
      severity,
      rootCause: cause,
      suggestedFix: fix,
      dbImpact: dbImp,
      userImpact: userImp,
      input,
      response: res.substring(0, 300)
    });
    console.log(`[BUG DETECTED] ${suiteName} (Severity: ${severity})`);
  };

  try {
    // ----------------------------------------------------
    // Test Suite 1: Citizen Profile Flow
    // ----------------------------------------------------
    console.log("\n--- Running Test Suite 1 ---");
    const sess1 = "sess-suite-1-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", sess1);
    await chatService.sendMessage("english", sess1);
    await chatService.sendMessage("File Complaint", sess1);
    await chatService.sendMessage("Raj", sess1);
    await chatService.sendMessage("9999000099", sess1);
    // Since manual city input transitions directly to IDENTIFY_ADDRESS without asking "yes", 
    // sending address next instead of location confirm.
    await chatService.sendMessage("Lucknow", sess1);
    await chatService.sendMessage("Sector 7, Gomti Nagar, Lucknow - 226002", sess1);
    const confirmRes1 = await chatService.sendMessage("yes", sess1);

    // Check database record
    const citizen = await prisma.citizen.findFirst({
      where: { mobileNumber: "9999000099" },
      orderBy: { createdAt: 'desc' }
    });

    if (!citizen) {
      addBug(
        "TS-1",
        "Citizen Profile Flow",
        "Citizen profile was not created in the database after workflow identification.",
        "Critical",
        "Prisma save operation returned an exception or transaction aborted.",
        "Verify database constraints and connection strings.",
        "Missing user keys in DB.",
        "Blocked application filing.",
        "Confirm Details (yes)",
        confirmRes1.response
      );
    } else {
      console.log(`[PASS] TS-1: Profile created for ${citizen.fullName}`);
    }

    // ----------------------------------------------------
    // Test Suite 2: Hindi Name Validation
    // ----------------------------------------------------
    console.log("\n--- Running Test Suite 2 ---");
    const sess2 = "sess-suite-2-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", sess2);
    await chatService.sendMessage("english", sess2);
    await chatService.sendMessage("Tenant Verification", sess2);
    const hindiNameRes = await chatService.sendMessage("राज", sess2);

    // Raj has length 3 and contains Hindi chars. Validate name expects name check to pass.
    const validHindi = validation.validateName("राज");
    if (!validHindi || hindiNameRes.response.includes("I may not have understood correctly")) {
      addBug(
        "TS-2",
        "Hindi Name Validation",
        "Single word Hindi Unicode name 'राज' was rejected or blocked workflow continuation.",
        "High",
        "Validation regex doesn't match Hindi Unicode blocks properly.",
        "Refactor ValidationService name matching regex to support Sanskrit/Devanagari Unicode charts.",
        "Orphaned profile entries.",
        "Blocked Hindi native speakers.",
        "राज",
        hindiNameRes.response
      );
    } else {
      console.log("[PASS] TS-2: Hindi Name Accepted");
    }

    // ----------------------------------------------------
    // Test Suite 3: Hindi Full Name Validation
    // ----------------------------------------------------
    console.log("\n--- Running Test Suite 3 ---");
    const sess3 = "sess-suite-3-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", sess3);
    await chatService.sendMessage("english", sess3);
    await chatService.sendMessage("Tenant Verification", sess3);
    const hindiFullNameRes = await chatService.sendMessage("मोहन सिंह", sess3);
    const hasRejected = hindiFullNameRes.response.includes("I may not have understood correctly") || hindiFullNameRes.response.includes("Example");

    if (hasRejected) {
      addBug(
        "TS-3",
        "Hindi Full Name Validation",
        "Hindi double-word name 'मोहन सिंह' was rejected.",
        "High",
        "Name checker fails to recognize spaces in Unicode strings.",
        "Add white-space patterns to Devanagari character sets.",
        "Cannot create profiles.",
        "Inability to register citizen details.",
        "मोहन सिंह",
        hindiFullNameRes.response
      );
    } else {
      console.log("[PASS] TS-3: Hindi Full Name Accepted");
    }

    // ----------------------------------------------------
    // Test Suite 4: Hinglish Intent Detection
    // ----------------------------------------------------
    console.log("\n--- Running Test Suite 4 ---");
    const sess4 = "sess-suite-4-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", sess4);
    await chatService.sendMessage("english", sess4);
    const hinglishRes = await chatService.sendMessage("Phone chori ho gaya", sess4);
    const state4 = await chatService.getOrCreateSession(sess4);

    if (state4.workflow !== "complaint") {
      addBug(
        "TS-4",
        "Hinglish Intent Detection",
        "Hinglish prompt 'Phone chori ho gaya' failed to resolve to complaint workflow.",
        "High",
        "Local intent detector regex lacks support for Hinglish variations like 'chori' or 'chora'.",
        "Enhance detectWorkflowIntent method in chat.service.ts with broader Hinglish keywords.",
        "Workflow sessions default to generic greeting.",
        "Poor conversational usability.",
        "Phone chori ho gaya",
        hinglishRes.response
      );
    } else {
      console.log("[PASS] TS-4: Hinglish Intent Detected");
    }

    // ----------------------------------------------------
    // Test Suite 6: Lost Mobile Complaint & TS-7 IMEI Skip
    // ----------------------------------------------------
    console.log("\n--- Running Test Suite 6 & 7 ---");
    const sess6 = "sess-suite-6-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", sess6);
    await chatService.sendMessage("english", sess6);
    await chatService.sendMessage("My phone was stolen", sess6);
    await chatService.sendMessage("Rahul Kumar", sess6);
    await chatService.sendMessage("9876543210", sess6);
    await chatService.sendMessage("Lucknow", sess6);
    await chatService.sendMessage("Hazratganj, Lucknow", sess6);
    await chatService.sendMessage("yes", sess6);

    // In local fallback state machine, lost mobile brand checks are omitted.
    // However, if the AI service fails, the fallback workflow doesn't prompt for IMEI.
    // This is an architectural gap between AI service and Local Fallback!
    const stepResponse = await chatService.sendMessage("Lost Mobile / Theft", sess6);

    // In fallback mode, there is no hardware field collection!
    const fallbackLacksHardware = !stepResponse.response.includes("IMEI") && !stepResponse.response.includes("Brand");
    if (fallbackLacksHardware) {
      addBug(
        "TS-6",
        "Lost Mobile Complaint Details",
        "NestJS fallback state machine does not collect hardware fields (brand, model, IMEI) for Theft complaints.",
        "Medium",
        "Local rule engine runs a generic complaints flow without parsing dynamic Theft subclasses.",
        "Synchronize fallback parameters in runComplaintWorkflow to prompt for hardware specs when type is Theft.",
        "Data schema is populated with nulls.",
        "Incomplete complaints registration.",
        "Lost Mobile / Theft",
        stepResponse.response
      );
    }

    // ----------------------------------------------------
    // Test Suite 8: Modify Details
    // ----------------------------------------------------
    console.log("\n--- Running Test Suite 8 ---");
    const sess8 = "sess-suite-8-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", sess8);
    await chatService.sendMessage("english", sess8);
    await chatService.sendMessage("My phone was stolen", sess8);
    await chatService.sendMessage("Rahul", sess8);
    await chatService.sendMessage("9876543210", sess8);
    await chatService.sendMessage("Lucknow", sess8);
    await chatService.sendMessage("Hazratganj, Lucknow", sess8);
    const modifyPrompt = await chatService.sendMessage("no", sess8); // triggers modify select

    const modifySelectVisible = modifyPrompt.response.includes("modify") || modifyPrompt.response.includes("Name") || modifyPrompt.response.includes("Number");
    if (!modifySelectVisible) {
      addBug(
        "TS-8",
        "Modify Details Navigation",
        "Clicking 'no' on profile confirmation does not open field selection menu.",
        "High",
        "The state machine step remains unchanged or restarts workflow.",
        "Set step to MODIFY_PROFILE_SELECT upon profile rejection.",
        "Session restart required.",
        "Frustrated user redirection.",
        "no",
        modifyPrompt.response
      );
    } else {
      console.log("[PASS] TS-8: Modify details menu displayed");
    }

    // ----------------------------------------------------
    // Test Suite 9: Location Change
    // ----------------------------------------------------
    console.log("\n--- Running Test Suite 9 ---");
    const sess9 = "sess-suite-9-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", sess9);
    await chatService.sendMessage("english", sess9);
    await chatService.sendMessage("My phone was stolen", sess9);
    await chatService.sendMessage("Rahul", sess9);
    await chatService.sendMessage("9876543210", sess9);
    await chatService.sendMessage("Lucknow", sess9);
    await chatService.sendMessage("Change location to Kanpur", sess9);

    const state9 = await chatService.getOrCreateSession(sess9);
    if (state9.citizen.city !== "Kanpur") {
      addBug(
        "TS-9",
        "Location Change Command",
        "Sending location change statement did not alter registered city to Kanpur.",
        "High",
        "Regex extraction failed to capture Kanpur or was blocked by step verification.",
        "Integrate location corrections in handleProfileCorrection method.",
        "Stale database location coordinates.",
        "Incorrect police station routing.",
        "Change location to Kanpur",
        `City set: ${state9.citizen.city}`
      );
    } else {
      console.log("[PASS] TS-9: Location updated to Kanpur");
    }

    // ----------------------------------------------------
    // Test Suite 11: Invalid Reference Number
    // ----------------------------------------------------
    console.log("\n--- Running Test Suite 11 ---");
    const sess11 = "sess-suite-11-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", sess11);
    await chatService.sendMessage("english", sess11);
    await chatService.sendMessage("Track status", sess11);
    const trackErrRes = await chatService.sendMessage("ABC123", sess11);

    const errorReturned = trackErrRes.response.includes("No application found") || trackErrRes.response.includes("not found") || trackErrRes.response.includes("check and try again") || trackErrRes.response.includes("format appears invalid") || trackErrRes.response.includes("invalid");
    if (!errorReturned) {
      addBug(
        "TS-11",
        "Invalid Reference Number Tracking",
        "Tracking returned positive status details instead of validation warning.",
        "Medium",
        "Tracking service mock resolves invalid patterns silently.",
        "Raise explicit record-not-found exceptions in TrackingService.",
        "Falsified application feedback.",
        "Mistrust of police systems.",
        "ABC123",
        trackErrRes.response
      );
    } else {
      console.log("[PASS] TS-11: Invalid ref check correctly warns user");
    }

    // ----------------------------------------------------
    // Test Suite 12: Emergency Override
    // ----------------------------------------------------
    console.log("\n--- Running Test Suite 12 ---");
    const sess12 = "sess-suite-12-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", sess12);
    await chatService.sendMessage("english", sess12);
    const emergencyRes = await chatService.sendMessage("Someone is attacking me right now", sess12);
    const emergencySuccess = emergencyRes.response.includes("112") || emergencyRes.response.includes("Emergency");

    if (!emergencySuccess) {
      addBug(
        "TS-12",
        "Emergency Override Intercept",
        "distress query did not trigger emergency notice.",
        "Critical",
        "Regex checker failed to match attack keyword.",
        "Add emergency overrides in global intercept wrapper.",
        "Life threatening delays.",
        "Citizen safety compromised.",
        "Someone is attacking me right now",
        emergencyRes.response
      );
    } else {
      console.log("[PASS] TS-12: Emergency dial 112 override successfully triggered");
    }

    // ----------------------------------------------------
    // Test Suite 14: Language Lock
    // ----------------------------------------------------
    console.log("\n--- Running Test Suite 14 ---");
    const sess14 = "sess-suite-14-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", sess14);
    await chatService.sendMessage("हिंदी", sess14);
    const langRes = await chatService.sendMessage("मेरा मोबाइल चोरी हो गया", sess14);

    // Check if response is localized using Unicode Hindi regex detection
    const isHindi = /[\u0900-\u097F]/.test(langRes.response);
    const state14 = await chatService.getOrCreateSession(sess14);

    if (!isHindi || state14.language !== 'hi') {
      addBug(
        "TS-14",
        "Language Lock Leak",
        "Selecting Hindi language fell back to English messages during complaint profile identification.",
        "Medium",
        "Local rule engine prompts default to English strings when steps are executed.",
        "Maintain localization references mapping prompts to the session's active language key.",
        "English columns saved in Hindi sessions.",
        "Accessibility barrier for non-English speakers.",
        "हिंदी / मेरा मोबाइल चोरी हो गया",
        langRes.response
      );
    } else {
      console.log("[PASS] TS-14: Language locked to Hindi prompts");
    }

    // ----------------------------------------------------
    // Test Suite 18: SQL Injection Test
    // ----------------------------------------------------
    console.log("\n--- Running Test Suite 18 ---");
    const sess18 = "sess-suite-18-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", sess18);
    await chatService.sendMessage("english", sess18);
    await chatService.sendMessage("My phone was stolen", sess18);

    const sqlPayloads = [
      "'; DROP TABLE Citizen; --",
      "' OR '1'='1",
      "admin' --",
      "' UNION SELECT * FROM Citizen --",
      "'; UPDATE Citizen SET fullName='Hacked';"
    ];

    let sqlFailed = false;
    for (const sqlPayload of sqlPayloads) {
      await chatService.sendMessage(sqlPayload, sess18);
      const citizensTableCheck = await prisma.citizen.count();
      if (citizensTableCheck === 0) {
        sqlFailed = true;
        addBug(
          "TS-18",
          "SQL Injection Vulnerability",
          `SQL Injection payload "${sqlPayload}" altered or dropped citizen database rows.`,
          "Critical",
          "Raw queries dynamically run without parameter binding or database protections.",
          "Secure ORM layers and filter query string parameters.",
          "Total database table loss.",
          "System offline.",
          sqlPayload,
          "Database Row Count dropped to 0"
        );
        break;
      }
    }
    if (!sqlFailed) {
      console.log("[PASS] TS-18: Safe from SQL injection payloads");
    }

    // ----------------------------------------------------
    // Test Suite 19: XSS Test
    // ----------------------------------------------------
    console.log("\n--- Running Test Suite 19 ---");
    const sess19 = "sess-suite-19-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", sess19);
    await chatService.sendMessage("english", sess19);
    await chatService.sendMessage("My phone was stolen", sess19);

    const xssPayloads = [
      "<script>alert(1)</script>",
      "<img src=x onerror=alert(1)>",
      "<svg onload=alert(1)>",
      "<a href=\"javascript:alert(1)\">click</a>"
    ];

    let xssFailed = false;
    for (const xssInput of xssPayloads) {
      const xssRes = await chatService.sendMessage(xssInput, sess19);
      if (xssRes.response.includes("<script>") || xssRes.response.includes("onerror") || xssRes.response.includes("onload") || xssRes.response.includes("javascript:")) {
        xssFailed = true;
        addBug(
          "TS-19",
          "XSS Vulnerability",
          `HTML scripts inside payload "${xssInput}" were saved or returned raw.`,
          "High",
          "Chat responses render inputs back raw without tag stripping or DOM sanitization.",
          "Sanitize backend messages using helper regexes and frontend with DOMPurify.",
          "Database stores malicious scripts.",
          "Execution of script inside user browser.",
          xssInput,
          xssRes.response
        );
        break;
      }
    }
    if (!xssFailed) {
      console.log("[PASS] TS-19: XSS script and event handler payloads sanitized");
    }

    // ----------------------------------------------------
    // Test Suite 20: Duplicate Submission
    // ----------------------------------------------------
    console.log("\n--- Running Test Suite 20 ---");
    const sess20 = "sess-suite-20-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", sess20);
    await chatService.sendMessage("english", sess20);
    await chatService.sendMessage("My phone was stolen", sess20);
    await chatService.sendMessage("Rahul Kumar", sess20);
    await chatService.sendMessage("9876543210", sess20);
    await chatService.sendMessage("Lucknow", sess20);
    await chatService.sendMessage("Hazratganj, Lucknow", sess20);
    await chatService.sendMessage("yes", sess20);
    await chatService.sendMessage("Lost Mobile / Theft", sess20);
    await chatService.sendMessage("Apple", sess20);
    await chatService.sendMessage("iPhone 15", sess20);
    await chatService.sendMessage("Black", sess20);
    await chatService.sendMessage("2024", sess20);
    await chatService.sendMessage("123456789012345", sess20);
    await chatService.sendMessage("Hazratganj Main Road", sess20);
    await chatService.sendMessage("15/07/2026", sess20);
    await chatService.sendMessage("Phone stolen from bag", sess20);

    // Send submit three times rapidly
    const resA = await chatService.sendMessage("Submit Application", sess20);
    const resB = await chatService.sendMessage("Submit Application", sess20);
    const resC = await chatService.sendMessage("Submit Application", sess20);

    const citizen20 = await prisma.citizen.findFirst({
      where: { mobileNumber: "9876543210" }
    });
    const trackingCount = await prisma.trackingRecord.count({
      where: { citizenId: citizen20 ? citizen20.id : "none" }
    });

    if (trackingCount > 1) {
      addBug(
        "TS-20",
        "Duplicate Submission Vulnerability",
        "Sending rapid submit commands generated multiple database records.",
        "High",
        "Workflow lacks session locking or reference duplicate check.",
        "Implement submission lock using session state reference numbers.",
        "Duplicate complaints in database.",
        "Wasted police administrative verification time.",
        "Submit Application x3",
        `Created ${trackingCount} records`
      );
    } else {
      console.log("[PASS] TS-20: Prevented duplicate complaint records");
    }

    // ----------------------------------------------------
    // Test Suite 21: Session Recovery
    // ----------------------------------------------------
    console.log("\n--- Running Test Suite 21 ---");
    const sess21 = "sess-suite-21-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", sess21);
    await chatService.sendMessage("english", sess21);
    await chatService.sendMessage("My phone was stolen", sess21);
    await chatService.sendMessage("Recovery User", sess21);

    // Simulate browser reload and state recovery
    const recoveredState = await chatService.getOrCreateSession(sess21);
    if (recoveredState.step !== "IDENTIFY_MOBILE" || recoveredState.citizen.fullName !== "Recovery User") {
      addBug(
        "TS-21",
        "Session Recovery Failure",
        "Session reload failed to resume citizen registration at the correct step.",
        "Medium",
        "Session values not persisted to SQL database or keys lost on load.",
        "Persist all updates directly inside database session store.",
        "Stale session states.",
        "Citizen has to register multiple times.",
        "Reload Session State",
        `Recovered Step: ${recoveredState.step}`
      );
    } else {
      console.log("[PASS] TS-21: State successfully restored after session reload");
    }

    // ----------------------------------------------------
    // Test Suite 22: Cross-Session Isolation
    // ----------------------------------------------------
    console.log("\n--- Running Test Suite 22 ---");
    const sessA = "sess-user-a-" + Math.random().toString(36).substring(7);
    const sessB = "sess-user-b-" + Math.random().toString(36).substring(7);

    await chatService.sendMessage("hello", sessA);
    await chatService.sendMessage("english", sessA);
    await chatService.sendMessage("My phone was stolen", sessA);
    await chatService.sendMessage("Raj", sessA);

    await chatService.sendMessage("hello", sessB);
    await chatService.sendMessage("english", sessB);
    await chatService.sendMessage("My phone was stolen", sessB);
    await chatService.sendMessage("Mohan", sessB);

    const stateA = await chatService.getOrCreateSession(sessA);
    const stateB = await chatService.getOrCreateSession(sessB);

    if (stateA.citizen.fullName === stateB.citizen.fullName) {
      addBug(
        "TS-22",
        "Cross-Session Leakage",
        "Raj's session details leaked into Mohan's session.",
        "Critical",
        "Global service state variables used instead of isolated sessions database indexes.",
        "Do not store citizen properties dynamically on singleton classes.",
        "Profile leakage across citizens.",
        "Privacy violation.",
        "Raj vs Mohan session registration",
        `User A: ${stateA.citizen.fullName}, User B: ${stateB.citizen.fullName}`
      );
    } else {
      console.log("[PASS] TS-22: Sessions are isolated");
    }

    // ----------------------------------------------------
    // Test Suite 23: Reference Number Uniqueness
    // ----------------------------------------------------
    console.log("\n--- Running Test Suite 23 ---");
    const refNumbers = new Set<string>();
    let duplicatesFound = false;
    for (let i = 0; i < 100; i++) {
      const sess = "sess-ref-" + i + "-" + Math.random().toString(36).substring(7);
      const state = await chatService.getOrCreateSession(sess);
      state.workflow = "complaint";
      state.step = "REVIEW";
      state.data = { type: "Lost Document", location: "Lucknow", time: "12/12/2025", description: "Lost file" };
      state.citizen = {
        fullName: `User ${i}`,
        mobileNumber: `9000000${i.toString().padStart(3, '0')}`,
        email: '',
        addressLine1: '',
        addressLine2: '',
        city: 'Lucknow',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        pincode: '',
        latitude: null,
        longitude: null,
        isConfirmed: true
      };
      await chatService.saveSession(sess, state);
      const res = await chatService.sendMessage("yes", sess);

      const match = res.response.match(/\bUP-CMP-2026-\d+\b/);
      if (match) {
        const ref = match[0];
        if (refNumbers.has(ref)) {
          duplicatesFound = true;
          addBug(
            "TS-23",
            "Non-Unique Reference Number",
            `Reference number "${ref}" generated multiple times.`,
            "High",
            "Random generator space is too small or collisions not caught.",
            "Utilize database check constraints or larger random digit pools.",
            "Database primary key collision exceptions.",
            "Status tracking corruption.",
            "Generate 100 applications",
            `Duplicate: ${ref}`
          );
          break;
        }
        refNumbers.add(ref);
      }
    }
    if (!duplicatesFound) {
      console.log("[PASS] TS-23: Generated 100 unique reference numbers successfully");
    }

    // ----------------------------------------------------
    // Test Suite 24: Applicant vs Subject Separation
    // ----------------------------------------------------
    console.log("\n--- Running Test Suite 24 ---");
    const sess24 = "sess-suite-24-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", sess24);
    await chatService.sendMessage("english", sess24);
    await chatService.sendMessage("Tenant Verification", sess24);
    await chatService.sendMessage("Raj", sess24);
    await chatService.sendMessage("9000900090", sess24);
    await chatService.sendMessage("Lucknow", sess24);
    await chatService.sendMessage("Hazratganj, Lucknow", sess24);
    await chatService.sendMessage("yes", sess24);

    // verification steps
    await chatService.sendMessage("Tenant Verification", sess24);
    await chatService.sendMessage("Mohan Singh", sess24);
    await chatService.sendMessage("Varanasi, UP", sess24);
    await chatService.sendMessage("9111911191", sess24);
    await chatService.sendMessage("Flat 12, Lucknow", sess24);
    await chatService.sendMessage("yes", sess24);

    // Check Citizen Table vs Verification table in database
    const applicant = await prisma.citizen.findFirst({
      where: { mobileNumber: "9000900090" }
    });
    const verificationRecord = await prisma.verification.findFirst({
      where: { name: "Mohan Singh" }
    });

    if (applicant && verificationRecord && applicant.fullName === verificationRecord.name) {
      addBug(
        "TS-24",
        "Applicant vs Subject Overwrite Leakage",
        "Subject name 'Mohan Singh' overwrote applicant profile name 'Raj' in the database.",
        "High",
        "Prisma update parameters mixed verification object scopes with session profile scopes.",
        "Explicitly separate verification candidate fields from session citizen profile values.",
        "Citizen profiles overwritten with random tenant names.",
        "Profile corruption.",
        "Verification submission",
        `Citizen Name: ${applicant.fullName}, Verification Candidate: ${verificationRecord.name}`
      );
    } else {
      console.log("[PASS] TS-24: Applicant and Subject records are separate");
    }

    // ----------------------------------------------------
    // Test Suite 25: Audit Log Validation
    // ----------------------------------------------------
    console.log("\n--- Running Test Suite 25 ---");
    const auditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const eventTypes = auditLogs.map(l => l.eventType);
    const expectedEvents = ['PROFILE_UPDATE', 'LOCATION_CHANGE', 'WORKFLOW_CHANGE', 'APPLICATION_SUBMISSION'];
    const missingEvents = expectedEvents.filter(e => !eventTypes.includes(e));

    if (missingEvents.length > 0) {
      addBug(
        "TS-25",
        "Audit Log Coverage Gaps",
        `Database audit log table is missing required event logs: ${missingEvents.join(', ')}`,
        "Medium",
        "State changes did not invoke audit log creation wrapper services.",
        "Ensure all state actions invoke prisma audit creation.",
        "Missing operational history.",
        "Auditing compliance failure.",
        "Inspect AuditLog Table",
        `Logged Types: ${eventTypes.join(', ')}`
      );
    } else {
      console.log("[PASS] TS-25: Audit logs generated for all workflow state transitions");
    }

    // ----------------------------------------------------
    // COMPILE AUDIT REPORT
    // ----------------------------------------------------
    const auditReportPath = "C:\\Users\\acer\\.gemini\\antigravity-ide\\brain\\5b6999c6-5211-4276-b0e9-be105d6bffbb\\bug_discovery_report.md";

    const reportMarkdown = `# Rakku QA Bug Discovery Report

Generated on: ${new Date().toLocaleString()}

## Overall Summary
* **Bugs Found**: ${bugs.length}
* **Critical**: ${bugs.filter(b => b.severity === "Critical").length}
* **High**: ${bugs.filter(b => b.severity === "High").length}
* **Medium**: ${bugs.filter(b => b.severity === "Medium").length}
* **Low**: ${bugs.filter(b => b.severity === "Low").length}

## Bugs Registry
${bugs.map(b => `
### [${b.id}] ${b.suite} (${b.severity} Severity)
- **Description**: ${b.description}
- **Exact User Input**: \`${b.input}\`
- **Exact Response**: \`${b.response}\`
- **Root Cause**: ${b.rootCause}
- **Suggested Fix**: ${b.suggestedFix}
- **Database Impact**: ${b.dbImpact}
- **User Impact**: ${b.userImpact}
`).join('\n')}
`;

    fs.writeFileSync(auditReportPath, reportMarkdown);
    console.log(`Saved discovery report to: ${auditReportPath}`);

  } catch (err) {
    console.error("Discovery run encountered fatal error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

runBugDiscoveryAudit();
