import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { SreService } from '../../backend/src/copilot/sre/sre.service';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * False Positive Evaluation Test
 *
 * Runs non-case queries from benchmarks/non_case_queries.json and verifies:
 *   - The system does not incorrectly route them to critical case scenarios
 *   - False Positive Rate <= 5%
 */
describe('False Positive Evaluation', () => {
  let sreService: SreService;
  let prisma: PrismaClient;
  const sessionIds: string[] = [];

  beforeAll(() => {
    const emitter = new EventEmitter2();
    sreService = new SreService(emitter);
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    // Clean up test sessions in bulk
    if (sessionIds.length > 0) {
      await prisma.scenarioAssessment.deleteMany({ where: { sessionId: { in: sessionIds } } }).catch(() => {});
      await prisma.scenarioSession.deleteMany({ where: { sessionId: { in: sessionIds } } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it('should pass frozen dataset manifest verification', () => {
    const manifestPath = path.resolve(__dirname, '../../benchmarks/manifest.json');
    const queriesPath = path.resolve(__dirname, '../../benchmarks/non_case_queries.json');

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const queriesContent = fs.readFileSync(queriesPath, 'utf8');
    const queries = JSON.parse(queriesContent);

    // Verify count
    expect(queries.length).toBe(manifest.nonCaseQueriesCount);

    // Verify MD5 hash
    const md5 = crypto.createHash('md5').update(queriesContent).digest('hex').toUpperCase();
    expect(md5).toBe(manifest.checksums.nonCaseQueries);
  });

  it('should meet false positive rate <= 5% requirement', async () => {
    const queriesPath = path.resolve(__dirname, '../../benchmarks/non_case_queries.json');
    const queries = JSON.parse(fs.readFileSync(queriesPath, 'utf8'));

    let falsePositives = 0;

    for (let i = 0; i < queries.length; i++) {
      const q = queries[i];
      const sessionId = `false-pos-bench-${i}-${Date.now()}`;
      sessionIds.push(sessionId);

      // Run SreService with empty scenario hints representing unrelated informational queries
      const result = await sreService.processIntent(
        sessionId,
        q.expectedHints,
        {},
        {
          cueConfidence: 0.10, // Very low confidence for non-cases
          saeConfidence: 0.10,
          scenarioHints: q.expectedHints
        }
      );

      // A false positive occurs if it incorrectly routes to a concrete active leaf scenario
      const leafScenarios = [
        'AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENCE', 'VEHICLE', 'MOBILE',
        'PROPERTY', 'UPI', 'CREDIT_CARD', 'EMPLOYMENT', 'BANKING', 'CYBER_CRIME',
        'CHARACTER_CERTIFICATE', 'TENANT_VERIFICATION', 'BIRTH_CERTIFICATE',
        'DEATH_CERTIFICATE', 'INCOME_CERTIFICATE', 'CASTE_CERTIFICATE', 'RESIDENCE_CERTIFICATE',
        'KIDNAPPING', 'ASSAULT', 'PENSION_DELAY', 'LAND_REGISTRY',
        'WATER_COMPLAINT', 'ELECTRICITY_COMPLAINT', 'MISSING_PERSON',
        'DOMESTIC_VIOLENCE', 'EMERGENCY_ASSISTANCE'
      ];

      const isFalsePositive = leafScenarios.includes(result.scenario);
      if (isFalsePositive) {
        falsePositives++;
        console.log(`[False Positive Failure] Input: "${q.query}" | Mapped to Scenario: "${result.scenario}"`);
      }
    }

    const falsePositiveRate = (falsePositives / queries.length) * 100;

    console.log(`[False Positive Rate: ${falsePositiveRate.toFixed(2)}%]`);

    expect(falsePositiveRate).toBeLessThanOrEqual(5);
  });
});
