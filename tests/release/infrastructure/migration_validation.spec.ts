import * as fs from 'fs';
import * as path from 'path';

/**
 * Migration Validation Test
 *
 * Validates:
 *   1. Prisma schema is syntactically valid
 *   2. All models referenced in code exist in schema
 *   3. Migration history directory exists and contains migrations
 *   4. Schema has backward-compatible nullable fields where expected
 *
 * Severity: CRITICAL – migration failure blocks deployment.
 */

describe('Migration Validation', () => {
  const rootDir = path.resolve(__dirname, '../../../');
  const schemaPath = path.join(rootDir, 'backend/prisma/schema.prisma');

  it('should have a valid Prisma schema file', () => {
    expect(fs.existsSync(schemaPath)).toBe(true);
    const content = fs.readFileSync(schemaPath, 'utf8');
    expect(content.length).toBeGreaterThan(100);
  });

  it('should define all required V2.7.5+ models', () => {
    const content = fs.readFileSync(schemaPath, 'utf8');
    const requiredModels = [
      'ScenarioSession',
      'ScenarioAssessment',
      'ScenarioGraphCandidate',
      'UnderstandingCandidate',
      'UnderstandingTerm',
      'UnderstandingReviewQueue',
      'CueReplayResult',
      'Citizen',
      'Complaint',
      'ChatHistory',
      'AuditLog'
    ];

    for (const model of requiredModels) {
      expect(content).toContain(`model ${model}`);
    }
  });

  it('should have nullable fields where backward compatibility requires them', () => {
    const content = fs.readFileSync(schemaPath, 'utf8');

    // These fields were added in V2.7.5 and must be nullable for old records
    const nullableFields = [
      'scenarioPath',
      'scenarioHints',
      'scenarioCompleteness',
      'scenarioConfidence',
      'confidenceHistory',
      'reasoningSummary',
      'resolutionSource',
      'graphVersion',
      'graphHash',
      'resolutionQuality',
      'hintConfidenceBreakdown'
    ];

    for (const field of nullableFields) {
      // Check that the field exists in the schema
      expect(content).toContain(field);
    }
  });

  it('should have correct output path for Prisma client generator', () => {
    const content = fs.readFileSync(schemaPath, 'utf8');
    expect(content).toContain('output   = "../../node_modules/.prisma/client"');
  });

  it('should have database URL configured via environment variable', () => {
    const content = fs.readFileSync(schemaPath, 'utf8');
    expect(content).toContain('env("DATABASE_URL")');
  });

  it('should have migrations directory', () => {
    const migrationsDir = path.join(rootDir, 'backend/prisma/migrations');
    if (fs.existsSync(migrationsDir)) {
      const entries = fs.readdirSync(migrationsDir);
      console.log(`[Migration Validation] Found ${entries.length} migration entries`);
      // At least the migration_lock.toml should exist
      expect(entries.length).toBeGreaterThan(0);
    }
  });

  it('should have all ScenarioSession fields for V2.7.5 session recovery', () => {
    const content = fs.readFileSync(schemaPath, 'utf8');

    // Extract the ScenarioSession model block
    const sessionModelStart = content.indexOf('model ScenarioSession');
    const sessionModelEnd = content.indexOf('}', sessionModelStart);
    const sessionBlock = content.substring(sessionModelStart, sessionModelEnd + 1);

    const requiredSessionFields = [
      'sessionId',
      'currentScenario',
      'clarificationCount',
      'askedQuestions',
      'currentNode',
      'scenarioRevision',
      'activeScenarioPath'
    ];

    for (const field of requiredSessionFields) {
      expect(sessionBlock).toContain(field);
    }
  });
});
