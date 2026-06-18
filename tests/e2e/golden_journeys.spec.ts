import { SreService } from '../../backend/src/copilot/sre/sre.service';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Golden Citizen Journey Tests
 *
 * These tests validate complete citizen stories end-to-end:
 *   1. Workflow matches expectations
 *   2. Scenario path resolves through correct graph nodes
 *   3. scenarioConfidence is within expected SLA bounds
 *   4. resolutionQuality maps correctly (FAST_PATH, HIGH_CONFIDENCE, etc.)
 *
 * Confidence validation catches silent quality degradation:
 *   Old confidence = 0.98 → workflow works
 *   New confidence = 0.62 → workflow still works, but quality dropped
 */

const releasePolicy = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../config/release-validation/release-policy.json'), 'utf8')
);

interface GoldenJourney {
  name: string;
  scenarioHints: string[];
  expectedWorkflow: string;
  expectedPathContains: string[];
  expectedMinConfidence: number;
  expectedMaxConfidence: number;
  expectedResolutionQualities: string[];
  cueConfidence: number;
  saeConfidence: number;
}

const GOLDEN_JOURNEYS: GoldenJourney[] = [
  // Loss
  {
    name: 'Lost Aadhaar Card',
    scenarioHints: ['LOSS', 'DOCUMENT', 'AADHAAR'],
    expectedWorkflow: 'DOCUMENT_REPLACEMENT',
    expectedPathContains: ['LOSS', 'DOCUMENT', 'AADHAAR'],
    expectedMinConfidence: 0.85,
    expectedMaxConfidence: 1.0,
    expectedResolutionQualities: ['FAST_PATH', 'HIGH_CONFIDENCE'],
    cueConfidence: 0.99,
    saeConfidence: 0.98
  },
  {
    name: 'Lost PAN Card',
    scenarioHints: ['LOSS', 'DOCUMENT', 'PAN'],
    expectedWorkflow: 'DOCUMENT_REPLACEMENT',
    expectedPathContains: ['LOSS', 'DOCUMENT', 'PAN'],
    expectedMinConfidence: 0.85,
    expectedMaxConfidence: 1.0,
    expectedResolutionQualities: ['FAST_PATH', 'HIGH_CONFIDENCE'],
    cueConfidence: 0.99,
    saeConfidence: 0.98
  },
  {
    name: 'Lost Driving Licence',
    scenarioHints: ['LOSS', 'DOCUMENT', 'DRIVING_LICENCE'],
    expectedWorkflow: 'DOCUMENT_REPLACEMENT',
    expectedPathContains: ['LOSS', 'DOCUMENT', 'DRIVING_LICENCE'],
    expectedMinConfidence: 0.85,
    expectedMaxConfidence: 1.0,
    expectedResolutionQualities: ['FAST_PATH', 'HIGH_CONFIDENCE'],
    cueConfidence: 0.99,
    saeConfidence: 0.98
  },
  {
    name: 'Lost Passport',
    scenarioHints: ['LOSS', 'DOCUMENT', 'PASSPORT'],
    expectedWorkflow: 'DOCUMENT_REPLACEMENT',
    expectedPathContains: ['LOSS', 'DOCUMENT', 'PASSPORT'],
    expectedMinConfidence: 0.85,
    expectedMaxConfidence: 1.0,
    expectedResolutionQualities: ['FAST_PATH', 'HIGH_CONFIDENCE'],
    cueConfidence: 0.99,
    saeConfidence: 0.98
  },
  {
    name: 'Lost Mobile',
    scenarioHints: ['LOSS', 'MOBILE'],
    expectedWorkflow: 'DOCUMENT_REPLACEMENT',
    expectedPathContains: ['LOSS', 'MOBILE'],
    expectedMinConfidence: 0.85,
    expectedMaxConfidence: 1.0,
    expectedResolutionQualities: ['FAST_PATH', 'HIGH_CONFIDENCE'],
    cueConfidence: 0.99,
    saeConfidence: 0.98
  },
  {
    name: 'Lost Vehicle Documents',
    scenarioHints: ['LOSS', 'VEHICLE'],
    expectedWorkflow: 'DOCUMENT_REPLACEMENT',
    expectedPathContains: ['LOSS', 'VEHICLE'],
    expectedMinConfidence: 0.85,
    expectedMaxConfidence: 1.0,
    expectedResolutionQualities: ['FAST_PATH', 'HIGH_CONFIDENCE'],
    cueConfidence: 0.99,
    saeConfidence: 0.98
  },
  // Fraud
  {
    name: 'UPI Fraud',
    scenarioHints: ['FRAUD', 'UPI'],
    expectedWorkflow: 'DOCUMENT_REPLACEMENT',
    expectedPathContains: ['FRAUD', 'UPI'],
    expectedMinConfidence: 0.85,
    expectedMaxConfidence: 1.0,
    expectedResolutionQualities: ['FAST_PATH', 'HIGH_CONFIDENCE'],
    cueConfidence: 0.99,
    saeConfidence: 0.98
  },
  {
    name: 'Banking Fraud',
    scenarioHints: ['FRAUD', 'BANKING'],
    expectedWorkflow: 'DOCUMENT_REPLACEMENT',
    expectedPathContains: ['FRAUD', 'BANKING'],
    expectedMinConfidence: 0.85,
    expectedMaxConfidence: 1.0,
    expectedResolutionQualities: ['FAST_PATH', 'HIGH_CONFIDENCE'],
    cueConfidence: 0.99,
    saeConfidence: 0.98
  },
  {
    name: 'Cyber Crime',
    scenarioHints: ['FRAUD', 'CYBER_CRIME'],
    expectedWorkflow: 'DOCUMENT_REPLACEMENT',
    expectedPathContains: ['FRAUD', 'CYBER_CRIME'],
    expectedMinConfidence: 0.85,
    expectedMaxConfidence: 1.0,
    expectedResolutionQualities: ['FAST_PATH', 'HIGH_CONFIDENCE'],
    cueConfidence: 0.99,
    saeConfidence: 0.98
  },
  // Services
  {
    name: 'Birth Certificate',
    scenarioHints: ['SERVICES', 'BIRTH_CERTIFICATE'],
    expectedWorkflow: 'DOCUMENT_REPLACEMENT',
    expectedPathContains: ['SERVICES', 'BIRTH_CERTIFICATE'],
    expectedMinConfidence: 0.85,
    expectedMaxConfidence: 1.0,
    expectedResolutionQualities: ['FAST_PATH', 'HIGH_CONFIDENCE'],
    cueConfidence: 0.99,
    saeConfidence: 0.98
  },
  {
    name: 'Death Certificate',
    scenarioHints: ['SERVICES', 'DEATH_CERTIFICATE'],
    expectedWorkflow: 'DOCUMENT_REPLACEMENT',
    expectedPathContains: ['SERVICES', 'DEATH_CERTIFICATE'],
    expectedMinConfidence: 0.85,
    expectedMaxConfidence: 1.0,
    expectedResolutionQualities: ['FAST_PATH', 'HIGH_CONFIDENCE'],
    cueConfidence: 0.99,
    saeConfidence: 0.98
  },
  {
    name: 'Income Certificate',
    scenarioHints: ['SERVICES', 'INCOME_CERTIFICATE'],
    expectedWorkflow: 'DOCUMENT_REPLACEMENT',
    expectedPathContains: ['SERVICES', 'INCOME_CERTIFICATE'],
    expectedMinConfidence: 0.85,
    expectedMaxConfidence: 1.0,
    expectedResolutionQualities: ['FAST_PATH', 'HIGH_CONFIDENCE'],
    cueConfidence: 0.99,
    saeConfidence: 0.98
  },
  {
    name: 'Caste Certificate',
    scenarioHints: ['SERVICES', 'CASTE_CERTIFICATE'],
    expectedWorkflow: 'DOCUMENT_REPLACEMENT',
    expectedPathContains: ['SERVICES', 'CASTE_CERTIFICATE'],
    expectedMinConfidence: 0.85,
    expectedMaxConfidence: 1.0,
    expectedResolutionQualities: ['FAST_PATH', 'HIGH_CONFIDENCE'],
    cueConfidence: 0.99,
    saeConfidence: 0.98
  },
  {
    name: 'Residence Certificate',
    scenarioHints: ['SERVICES', 'RESIDENCE_CERTIFICATE'],
    expectedWorkflow: 'DOCUMENT_REPLACEMENT',
    expectedPathContains: ['SERVICES', 'RESIDENCE_CERTIFICATE'],
    expectedMinConfidence: 0.85,
    expectedMaxConfidence: 1.0,
    expectedResolutionQualities: ['FAST_PATH', 'HIGH_CONFIDENCE'],
    cueConfidence: 0.99,
    saeConfidence: 0.98
  },
  // Public Grievance
  {
    name: 'Pension Delay',
    scenarioHints: ['GRIEVANCE', 'PENSION_DELAY'],
    expectedWorkflow: 'DOCUMENT_REPLACEMENT',
    expectedPathContains: ['GRIEVANCE', 'PENSION_DELAY'],
    expectedMinConfidence: 0.85,
    expectedMaxConfidence: 1.0,
    expectedResolutionQualities: ['FAST_PATH', 'HIGH_CONFIDENCE'],
    cueConfidence: 0.99,
    saeConfidence: 0.98
  },
  {
    name: 'Land Registry Issue',
    scenarioHints: ['GRIEVANCE', 'LAND_REGISTRY'],
    expectedWorkflow: 'DOCUMENT_REPLACEMENT',
    expectedPathContains: ['GRIEVANCE', 'LAND_REGISTRY'],
    expectedMinConfidence: 0.85,
    expectedMaxConfidence: 1.0,
    expectedResolutionQualities: ['FAST_PATH', 'HIGH_CONFIDENCE'],
    cueConfidence: 0.99,
    saeConfidence: 0.98
  },
  {
    name: 'Water Complaint',
    scenarioHints: ['GRIEVANCE', 'WATER_COMPLAINT'],
    expectedWorkflow: 'DOCUMENT_REPLACEMENT',
    expectedPathContains: ['GRIEVANCE', 'WATER_COMPLAINT'],
    expectedMinConfidence: 0.85,
    expectedMaxConfidence: 1.0,
    expectedResolutionQualities: ['FAST_PATH', 'HIGH_CONFIDENCE'],
    cueConfidence: 0.99,
    saeConfidence: 0.98
  },
  {
    name: 'Electricity Complaint',
    scenarioHints: ['GRIEVANCE', 'ELECTRICITY_COMPLAINT'],
    expectedWorkflow: 'DOCUMENT_REPLACEMENT',
    expectedPathContains: ['GRIEVANCE', 'ELECTRICITY_COMPLAINT'],
    expectedMinConfidence: 0.85,
    expectedMaxConfidence: 1.0,
    expectedResolutionQualities: ['FAST_PATH', 'HIGH_CONFIDENCE'],
    cueConfidence: 0.99,
    saeConfidence: 0.98
  },
  // Safety
  {
    name: 'Missing Person',
    scenarioHints: ['SAFETY', 'MISSING_PERSON'],
    expectedWorkflow: 'DOCUMENT_REPLACEMENT',
    expectedPathContains: ['SAFETY', 'MISSING_PERSON'],
    expectedMinConfidence: 0.85,
    expectedMaxConfidence: 1.0,
    expectedResolutionQualities: ['FAST_PATH', 'HIGH_CONFIDENCE'],
    cueConfidence: 0.99,
    saeConfidence: 0.98
  },
  {
    name: 'Domestic Violence',
    scenarioHints: ['SAFETY', 'DOMESTIC_VIOLENCE'],
    expectedWorkflow: 'EMERGENCY_ESCALATION',
    expectedPathContains: ['SAFETY', 'DOMESTIC_VIOLENCE'],
    expectedMinConfidence: 0.60,
    expectedMaxConfidence: 1.0,
    expectedResolutionQualities: ['FAST_PATH', 'HIGH_CONFIDENCE', 'EMERGENCY_ESCALATION', 'OFFICER_REVIEW', 'FALLBACK'],
    cueConfidence: 0.90,
    saeConfidence: 0.85
  },
  {
    name: 'Emergency Assistance',
    scenarioHints: ['SAFETY', 'EMERGENCY_ASSISTANCE'],
    expectedWorkflow: 'EMERGENCY_ESCALATION',
    expectedPathContains: ['SAFETY', 'EMERGENCY_ASSISTANCE'],
    expectedMinConfidence: 0.60,
    expectedMaxConfidence: 1.0,
    expectedResolutionQualities: ['FAST_PATH', 'HIGH_CONFIDENCE', 'EMERGENCY_ESCALATION', 'OFFICER_REVIEW', 'FALLBACK'],
    cueConfidence: 0.90,
    saeConfidence: 0.85
  }
];

describe('Golden Citizen Journeys – Workflow, Path, Confidence & Quality SLA', () => {
  let sreService: SreService;
  let prisma: PrismaClient;
  const sessionIds: string[] = [];

  beforeAll(() => {
    const emitter = new EventEmitter2();
    sreService = new SreService(emitter);
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    // Clean up test sessions
    if (sessionIds.length > 0) {
      await prisma.scenarioAssessment.deleteMany({ where: { sessionId: { in: sessionIds } } }).catch(() => {});
      await prisma.scenarioSession.deleteMany({ where: { sessionId: { in: sessionIds } } }).catch(() => {});
    }
    await prisma.$disconnect();
  }, 15000);

  for (const journey of GOLDEN_JOURNEYS) {
    describe(`Journey: ${journey.name}`, () => {
      let assessment: any;
      const sessionId = `golden-${journey.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      beforeAll(async () => {
        sessionIds.push(sessionId);
        assessment = await sreService.processIntent(
          sessionId,
          journey.scenarioHints,
          { misuseSuspected: true },
          {
            cueConfidence: journey.cueConfidence,
            saeConfidence: journey.saeConfidence,
            scenarioHints: journey.scenarioHints
          }
        );
      });

      it('should resolve to expected workflow outcome', () => {
        expect(assessment).toBeDefined();
        expect(assessment.outcome).toBe(journey.expectedWorkflow);
      });

      it('should resolve through expected scenario path nodes', () => {
        const resolvedPath: string[] = assessment.scenarioPath || [];
        for (const expectedNode of journey.expectedPathContains) {
          expect(resolvedPath).toContain(expectedNode);
        }
      });

      it('should produce scenarioConfidence within SLA bounds', () => {
        const confidence = assessment.scenarioConfidence;
        expect(confidence).toBeGreaterThanOrEqual(journey.expectedMinConfidence);
        expect(confidence).toBeLessThanOrEqual(journey.expectedMaxConfidence);

        console.log(`  [${journey.name}] Confidence: ${confidence} (SLA: ${journey.expectedMinConfidence}–${journey.expectedMaxConfidence})`);
      });

      it('should map resolutionQuality to an expected value', () => {
        expect(journey.expectedResolutionQualities).toContain(assessment.resolutionQuality);

        console.log(`  [${journey.name}] Quality: ${assessment.resolutionQuality}`);
      });

      it('should have hintConfidenceBreakdown present', () => {
        expect(assessment.hintConfidenceBreakdown).toBeDefined();
        expect(assessment.hintConfidenceBreakdown.cue).toBeDefined();
        expect(assessment.hintConfidenceBreakdown.sae).toBeDefined();
        expect(assessment.hintConfidenceBreakdown.sre).toBeDefined();
      });
    });
  }

  it('should detect silent confidence degradation between journeys', async () => {
    // Simulate a "before" run with high confidence
    const sidBefore = `golden-degrade-before-${Date.now()}`;
    sessionIds.push(sidBefore);
    const before = await sreService.processIntent(
      sidBefore,
      ['LOSS', 'DOCUMENT', 'AADHAAR'],
      {},
      { cueConfidence: 0.99, saeConfidence: 0.98, scenarioHints: ['LOSS', 'DOCUMENT', 'AADHAAR'] }
    );

    // Simulate an "after" run with degraded confidence
    const sidAfter = `golden-degrade-after-${Date.now()}`;
    sessionIds.push(sidAfter);
    const after = await sreService.processIntent(
      sidAfter,
      ['LOSS', 'DOCUMENT', 'AADHAAR'],
      {},
      { cueConfidence: 0.60, saeConfidence: 0.55, scenarioHints: ['LOSS', 'DOCUMENT', 'AADHAAR'] }
    );

    // Both resolve the same path, but confidence drops
    expect(before.scenario).toBe(after.scenario);
    expect(before.scenarioConfidence).toBeGreaterThan(after.scenarioConfidence);

    const drop = before.scenarioConfidence - after.scenarioConfidence;
    console.log(`  [Degradation Check] Before: ${before.scenarioConfidence}, After: ${after.scenarioConfidence}, Drop: ${drop.toFixed(4)}`);

    // The golden journey must flag this as a significant quality regression
    expect(drop).toBeGreaterThan(0.10);
  });
});
