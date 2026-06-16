import { CopilotTelemetryListener } from '../../backend/src/complaint-intelligence/copilot-telemetry.listener';
import { PrismaService } from '../../backend/src/prisma.service';

describe('Copilot Telemetry & Privacy Hardening Spec', () => {
  let listener: CopilotTelemetryListener;
  let prisma: PrismaService;

  beforeAll(() => {
    jest.setTimeout(30000);
    prisma = new PrismaService();
    listener = new CopilotTelemetryListener(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should mask Aadhaar, mobile numbers, UPI IDs, and address details in telemetries', async () => {
    const sessionId = "telemetry-test-session-" + Math.random().toString(36).substring(7);

    // Emit event with PII
    await listener.handleIntentDetected({
      sessionId,
      result: {
        predictedIntent: "LOST_MOBILE",
        confidence: 0.95,
        urgency: "MEDIUM",
        recommendedServices: ["COMPLAINT"],
        // PII inside details or random text
        rawText: "My Aadhaar is 1234 5678 9012 and my number is 9876543210. I sent money to test@okaxis. My address is Lucknow, Uttar Pradesh, 226001."
      }
    });

    // Let's retrieve the audit log
    const auditLogs = await prisma.auditLog.findMany({
      where: { sessionId, eventType: 'INTENT_DETECTED' }
    });

    expect(auditLogs.length).toBe(1);
    const log = auditLogs[0];
    const dataStr = JSON.stringify(log.eventData);

    // Assert PII is masked
    expect(dataStr).not.toContain("1234 5678 9012");
    expect(dataStr).not.toContain("9876543210");
    expect(dataStr).not.toContain("test@okaxis");
    expect(dataStr).not.toContain("226001");

    // Assert replaced/masked formats
    expect(dataStr).toContain("XXXX-XXXX-XXXX");
    expect(dataStr).toContain("XXXXXX-XXXX");
    expect(dataStr).toContain("XXXX@XXXX");
    expect(dataStr).toContain("XXXXXX");
  }, 30000);

  it('should explicitly mask address fields or incident location in fact.extracted telemetry', async () => {
    const sessionId = "telemetry-test-session-" + Math.random().toString(36).substring(7);

    await listener.handleFactExtracted({
      sessionId,
      result: {
        incidentType: "LOST_MOBILE",
        complaintReadinessScore: 0.85,
        firReadinessScore: 0.70,
        extractedFacts: [
          { field: "incident_location", value: "Police Station Hazratganj, Lucknow", confidence: 0.95, source: "USER" },
          { field: "aadhar_card", value: "9876-5432-1098", confidence: 0.99, source: "USER" },
          { field: "victim_phone", value: "9988776655", confidence: 0.99, source: "USER" }
        ]
      }
    });

    const auditLogs = await prisma.auditLog.findMany({
      where: { sessionId, eventType: 'FACT_EXTRACTED' }
    });

    expect(auditLogs.length).toBe(1);
    const log = auditLogs[0];
    const dataStr = JSON.stringify(log.eventData);

    // Location key check or replacement
    expect(dataStr).not.toContain("Hazratganj");
    expect(dataStr).not.toContain("9876-5432-1098");
    expect(dataStr).not.toContain("9988776655");
    expect(dataStr).toContain("[MASKED_ADDRESS]");
  }, 30000);
});
