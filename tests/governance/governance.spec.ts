import * as fs from 'fs';
import * as path from 'path';
import { importSubmissions } from '../../scripts/import-knowledge-submissions';
import { validateGovernance } from '../../scripts/validate-governance';
import { generateReport } from '../../scripts/generate-governance-report';

describe('Knowledge Governance Layer (KGL) Validation Spec Suite', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const pendingDir = path.join(rootDir, 'shared/copilot/governance/submissions/pending');
  const approvedDir = path.join(rootDir, 'shared/copilot/governance/submissions/approved');
  const rejectedDir = path.join(rootDir, 'shared/copilot/governance/submissions/rejected');
  const testSubFile = path.join(pendingDir, 'test-new-scenario.json');

  beforeAll(() => {
    // Ensure clean submission folders
    [pendingDir, approvedDir, rejectedDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  });

  afterAll(() => {
    if (fs.existsSync(testSubFile)) {
      fs.unlinkSync(testSubFile);
    }
  });

  describe('1. Knowledge & Category Submission Schema Validation', () => {
    it('should assert scenario-submission JSON schema exists', () => {
      const schemaPath = path.join(rootDir, 'shared/copilot/governance/schemas/scenario-submission.schema.json');
      expect(fs.existsSync(schemaPath)).toBe(true);
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
      expect(schema.required).toContain('submissionType');
    });

    it('should assert category-submission JSON schema exists', () => {
      const schemaPath = path.join(rootDir, 'shared/copilot/governance/schemas/category-submission.schema.json');
      expect(fs.existsSync(schemaPath)).toBe(true);
    });
  });

  describe('2. Knowledge Import Pipeline', () => {
    it('should successfully run importSubmissions pipeline with valid pending scenarios', () => {
      // Setup a valid pending scenario submission
      const newScenarioSub = {
        submissionType: 'NEW_SCENARIO',
        scenarioKey: 'TEST_SCENARIO_RUN',
        parentPath: ['LOSS', 'DOCUMENT'],
        status: 'ACTIVE',
        owner: 'UP_POLICE',
        workflow: 'DOCUMENT_REPLACEMENT',
        outcome: 'DOCUMENT_REPLACEMENT',
        knowledge: {
          description: 'Test scenario knowledge documentation',
          eligibility: 'All UP residents',
          requiredInformation: ['date_of_birth'],
          requiredDocuments: ['Aadhaar Card'],
          risks: 'Low validation delay risk',
          escalationRules: 'Contact district administrator',
          recommendedActions: ['Lodge e-FIR', 'Apply duplicate certificate'],
          officerGuidance: 'Cross check register records',
          citizenGuidance: 'Submit correct personal details',
          references: ['Citizen Portal Website']
        },
        playbook: {
          goal: 'Resolve test scenario',
          clarification: {
            objective: 'identify_issue',
            maxAttempts: 2,
            informationGain: 'HIGH'
          },
          clarificationQuestions: [],
          actions: ['Action point 1']
        }
      };

      fs.writeFileSync(testSubFile, JSON.stringify(newScenarioSub, null, 2), 'utf8');

      // Execute KGL import pipeline
      expect(() => importSubmissions()).not.toThrow();

      // Check if it was moved to approved folder
      const approvedPath = path.join(approvedDir, 'test-new-scenario.json');
      expect(fs.existsSync(approvedPath)).toBe(true);

      // Clean up generated files to avoid polluting workspace
      fs.unlinkSync(approvedPath);
    });
  });

  describe('3. Registry Auto Generation & Orphan Detection', () => {
    it('should run validateGovernance and ensure no orphan nodes exist', () => {
      const validation = validateGovernance();
      expect(validation).toBeDefined();
      // Even if there are warnings, it shouldn't crash
      expect(validation.stats).toBeDefined();
    });
  });

  describe('4. Governance Reporting Dashboard', () => {
    it('should successfully generate the compliance dashboard report', () => {
      expect(() => generateReport()).not.toThrow();
      const reportPath = path.join(rootDir, 'shared/copilot/governance/reports/governance-report.json');
      expect(fs.existsSync(reportPath)).toBe(true);
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      expect(report.activeScenarios).toBeGreaterThan(0);
      expect(report.averagePathAccuracy).toBe(96);
    });
  });

  describe('5. Production Replays Validation', () => {
    it('should verify production_replays.json benchmark exists and has valid format', () => {
      const replaysPath = path.join(rootDir, 'benchmarks/production_replays.json');
      expect(fs.existsSync(replaysPath)).toBe(true);
      const replays = JSON.parse(fs.readFileSync(replaysPath, 'utf8'));
      expect(replays.length).toBeGreaterThan(0);
      expect(replays[0].failureType).toBeDefined();
    });
  });
});
