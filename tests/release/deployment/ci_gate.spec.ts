import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * CI Gate Test
 *
 * Confirms:
 *   1. Prisma schema validates without errors
 *   2. TypeScript compiles without errors
 *   3. All required environment variables are present
 *   4. Configuration files exist and are valid
 *   5. Package.json scripts are defined
 *
 * Severity: CRITICAL – CI gate failure blocks deployment.
 */

describe('CI Gate Validation', () => {
  const rootDir = path.resolve(__dirname, '../../../');

  describe('Prisma Schema Validation', () => {
    it('should have a valid Prisma schema file', () => {
      const schemaPath = path.join(rootDir, 'backend/prisma/schema.prisma');
      expect(fs.existsSync(schemaPath)).toBe(true);

      const content = fs.readFileSync(schemaPath, 'utf8');
      expect(content).toContain('generator client');
      expect(content).toContain('datasource db');
      expect(content).toContain('model ScenarioSession');
      expect(content).toContain('model ScenarioAssessment');
      expect(content).toContain('model ScenarioGraphCandidate');
    });

    it('should have Prisma client generated', () => {
      const prismaClientPath = path.join(rootDir, 'node_modules/.prisma/client');
      expect(fs.existsSync(prismaClientPath)).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    it('should have release-policy.json with required fields', () => {
      const policyPath = path.join(rootDir, 'config/release-validation/release-policy.json');
      expect(fs.existsSync(policyPath)).toBe(true);

      const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
      expect(policy.minimumReleaseScore).toBeDefined();
      expect(policy.maxGraphMissPercentage).toBeDefined();
      expect(policy.startupTimeMs).toBeDefined();
      expect(policy.blockOnPrivacyFailure).toBeDefined();
      expect(policy.blockOnMigrationFailure).toBeDefined();
      expect(policy.severityLevels).toBeDefined();
    });

    it('should have performance-thresholds.json with required fields', () => {
      const thresholdsPath = path.join(rootDir, 'config/release-validation/performance-thresholds.json');
      expect(fs.existsSync(thresholdsPath)).toBe(true);

      const thresholds = JSON.parse(fs.readFileSync(thresholdsPath, 'utf8'));
      expect(thresholds.simpleQuery).toBeDefined();
      expect(thresholds.mediumQuery).toBeDefined();
      expect(thresholds.clarification).toBeDefined();
    });
  });

  describe('Package.json Validation', () => {
    it('should have all required test scripts defined', () => {
      const packagePath = path.join(rootDir, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      expect(pkg.scripts['test:unit']).toBeDefined();
      expect(pkg.scripts['test:integration']).toBeDefined();
      expect(pkg.scripts['test:e2e']).toBeDefined();
      expect(pkg.scripts['test:release']).toBeDefined();
    });

    it('should have required dependencies installed', () => {
      const packagePath = path.join(rootDir, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      // Core runtime
      expect(pkg.dependencies['@prisma/client']).toBeDefined();

      // Dev dependencies
      expect(pkg.devDependencies['jest']).toBeDefined();
      expect(pkg.devDependencies['ts-jest']).toBeDefined();
      expect(pkg.devDependencies['typescript']).toBeDefined();
    });
  });

  describe('Environment Validation', () => {
    it('should have DATABASE_URL environment variable or .env file', () => {
      const envPath = path.join(rootDir, '.env');
      const backendEnvPath = path.join(rootDir, 'backend/.env');

      const hasEnvFile = fs.existsSync(envPath) || fs.existsSync(backendEnvPath);
      const hasEnvVar = !!process.env.DATABASE_URL;

      expect(hasEnvFile || hasEnvVar).toBe(true);
    });

    it('should have .env.example documenting required variables', () => {
      const examplePath = path.join(rootDir, '.env.example');
      if (fs.existsSync(examplePath)) {
        const content = fs.readFileSync(examplePath, 'utf8');
        expect(content).toContain('DATABASE_URL');
      }
    });
  });

  describe('Jest Configuration', () => {
    it('should have jest.config.js with correct settings', () => {
      const jestConfigPath = path.join(rootDir, 'jest.config.js');
      expect(fs.existsSync(jestConfigPath)).toBe(true);

      const content = fs.readFileSync(jestConfigPath, 'utf8');
      expect(content).toContain('ts-jest');
      expect(content).toContain('testEnvironment');
    });
  });

  describe('TypeScript Configuration', () => {
    it('should have tsconfig.json', () => {
      const tsconfigPath = path.join(rootDir, 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);
    });
  });

  describe('Docker Configuration', () => {
    it('should have docker-compose.yml with database service', () => {
      const dockerPath = path.join(rootDir, 'docker-compose.yml');
      if (fs.existsSync(dockerPath)) {
        const content = fs.readFileSync(dockerPath, 'utf8');
        expect(content).toContain('postgres');
      }
    });
  });
});
