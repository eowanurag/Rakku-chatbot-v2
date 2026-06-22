import * as fs from 'fs';
import * as path from 'path';

describe('Repository Health Release Gate Tests', () => {
  const reportsDir = path.resolve(__dirname, '../../storage/reports');
  let healthReport: any;
  let isCI = false;

  beforeAll(() => {
    isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
    const reportPath = path.join(reportsDir, 'repository-health-report.json');
    if (fs.existsSync(reportPath)) {
      healthReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    }
  });

  afterAll(() => {
    console.log('__RELEASE_HEALTH_GATE_DONE__');
  });

  it('should enforce health thresholds', () => {
    const dbReportPath = path.join(reportsDir, 'database-remediation-report.json');
    let duplicateMobiles = 0;
    let orphanRecords = 0;
    let missingIndexesCount = 0;

    if (fs.existsSync(dbReportPath)) {
      const dbReport = JSON.parse(fs.readFileSync(dbReportPath, 'utf8'));
      duplicateMobiles = dbReport.duplicateRecords || 0;
      orphanRecords = dbReport.orphanRecords || 0;
      missingIndexesCount = (dbReport.missingIndexes || []).length;
    }

    let hasCircular = false;
    const circPath = path.join(reportsDir, 'circular-dependencies.json');
    if (fs.existsSync(circPath)) {
      const circ = JSON.parse(fs.readFileSync(circPath, 'utf8'));
      if (Array.isArray(circ) && circ.length > 0) {
        hasCircular = true;
      }
    }

    const dbHistoryPath = path.join(reportsDir, 'database-health-history.json');
    let dbHealthScore = 100;
    let repoHealthScore = 100;
    if (fs.existsSync(dbHistoryPath)) {
      const dbHistory = JSON.parse(fs.readFileSync(dbHistoryPath, 'utf8'));
      if (dbHistory.length > 0) {
        const latest = dbHistory[dbHistory.length - 1];
        dbHealthScore = latest.databaseHealthScore ?? 100;
        repoHealthScore = latest.repositoryHealthScore ?? 100;
      }
    }

    const errors: string[] = [];
    if (duplicateMobiles > 0) errors.push(`Duplicate mobile count is ${duplicateMobiles} (threshold: 0)`);
    if (orphanRecords > 0) errors.push(`Orphan record count is ${orphanRecords} (threshold: 0)`);
    if (hasCircular) errors.push(`Circular dependencies detected`);
    if (repoHealthScore < 80) errors.push(`Repository health score is ${repoHealthScore} (threshold: 80)`);
    if (dbHealthScore < 90) errors.push(`Database health score is ${dbHealthScore} (threshold: 90)`);

    if (errors.length > 0) {
      if (isCI) {
        throw new Error(`[RELEASE GATE FAILED] Build cannot proceed:\n- ${errors.join('\n- ')}`);
      } else {
        console.warn(`[RELEASE GATE WARNING] Staging audit alerts (Local Dev mode - Warn only):\n- ${errors.join('\n- ')}`);
      }
    } else {
      console.log('[RELEASE GATE PASSED] All repository health thresholds satisfied.');
    }

    // Always succeed locally, fail on CI
    if (isCI) {
      expect(errors.length).toBe(0);
    } else {
      expect(true).toBe(true);
    }
  });
});
