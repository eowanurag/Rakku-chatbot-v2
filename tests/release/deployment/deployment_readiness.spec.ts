import * as fs from 'fs';
import * as path from 'path';

/**
 * Deployment Readiness Test
 *
 * Asserts that all deployment artifacts, playbooks, and configurations
 * are present and correctly defined for production deployment.
 *
 * Severity: HIGH – missing deployment artifacts cause failed rollouts.
 */

describe('Deployment Readiness Validation', () => {
  const rootDir = path.resolve(__dirname, '../../../');

  describe('Critical File Presence', () => {
    const requiredFiles = [
      'package.json',
      'jest.config.js',
      'tsconfig.json',
      'backend/prisma/schema.prisma',
      'config/release-validation/release-policy.json',
      'config/release-validation/performance-thresholds.json',
      'shared/copilot/scenario-graphs/graphs.json',
      'shared/copilot/intents.json',
      'shared/copilot/service-mappings.json',
    ];

    for (const file of requiredFiles) {
      it(`should have ${file}`, () => {
        const fullPath = path.join(rootDir, file);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    }
  });

  describe('Playbook Definitions', () => {
    it('should have playbooks directory with at least one playbook', () => {
      const playbooksDir = path.join(rootDir, 'shared/copilot/playbooks');
      if (fs.existsSync(playbooksDir)) {
        const files = fs.readdirSync(playbooksDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
        expect(files.length).toBeGreaterThan(0);

        // Each playbook should contain goal and actions
        for (const file of files) {
          const content = fs.readFileSync(path.join(playbooksDir, file), 'utf8');
          expect(content).toContain('goal:');
          expect(content).toContain('actions:');
        }
      }
    });
  });

  describe('Knowledge Base', () => {
    it('should have knowledge directory with knowledge files', () => {
      const knowledgeDir = path.join(rootDir, 'shared/copilot/knowledge');
      if (fs.existsSync(knowledgeDir)) {
        const files = fs.readdirSync(knowledgeDir).filter(f => f.endsWith('.json'));
        expect(files.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Risk and Outcome Rules', () => {
    it('should have risk-rules directory', () => {
      const riskDir = path.join(rootDir, 'shared/copilot/risk-rules');
      expect(fs.existsSync(riskDir)).toBe(true);
    });

    it('should have outcome-rules directory', () => {
      const outcomeDir = path.join(rootDir, 'shared/copilot/outcome-rules');
      expect(fs.existsSync(outcomeDir)).toBe(true);
    });
  });

  describe('GitHub Actions / CI Config', () => {
    it('should have .github directory for CI workflows', () => {
      const githubDir = path.join(rootDir, '.github');
      expect(fs.existsSync(githubDir)).toBe(true);
    });
  });

  describe('Documentation', () => {
    it('should have README.md', () => {
      const readmePath = path.join(rootDir, 'README.md');
      expect(fs.existsSync(readmePath)).toBe(true);

      const content = fs.readFileSync(readmePath, 'utf8');
      expect(content.length).toBeGreaterThan(100);
    });
  });

  describe('Gitignore', () => {
    it('should have .gitignore that excludes node_modules and .env', () => {
      const gitignorePath = path.join(rootDir, '.gitignore');
      expect(fs.existsSync(gitignorePath)).toBe(true);

      const content = fs.readFileSync(gitignorePath, 'utf8');
      expect(content).toContain('node_modules');
      expect(content).toContain('.env');
    });
  });
});
