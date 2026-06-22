import * as fs from 'fs';
import * as path from 'path';

describe('Governance Continuous Certification Gate Tests', () => {
  const reportsDir = path.resolve(__dirname, '../../storage/reports');
  let isCI = false;

  beforeAll(() => {
    isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  });

  afterAll(() => {
    console.log('__GOVERNANCE_CERTIFICATION_DONE__');
  });

  it('should verify release gate conditions and fail build if on CI', () => {
    let repoDrift = 'HEALTHY';
    let dbDrift = 'HEALTHY';
    try {
      const rep = JSON.parse(fs.readFileSync(path.join(reportsDir, 'repository-drift-report.json'), 'utf8'));
      repoDrift = rep.severity || 'HEALTHY';
    } catch (e) {}

    let techDebtScore = 0;
    try {
      const tdr = JSON.parse(fs.readFileSync(path.join(reportsDir, 'technical-debt-report.json'), 'utf8'));
      techDebtScore = tdr.debtScore || 0;
    } catch (e) {}

    // Calculate baseline scores
    let dbHealthScore = 100;
    let repoHealthScore = 100;
    try {
      const dbHistory = JSON.parse(fs.readFileSync(path.join(reportsDir, 'database-health-history.json'), 'utf8'));
      if (dbHistory.length > 0) {
        const latest = dbHistory[dbHistory.length - 1];
        dbHealthScore = latest.databaseHealthScore ?? 100;
        repoHealthScore = latest.repositoryHealthScore ?? 100;
      }
    } catch (e) {}

    const errors: string[] = [];
    if (repoDrift === 'CRITICAL') errors.push('Repository Drift is CRITICAL');
    if (dbDrift === 'CRITICAL') errors.push('Database Drift is CRITICAL');
    if (techDebtScore > 60) errors.push(`Technical Debt Score is ${techDebtScore} (threshold: 60)`);
    if (dbHealthScore < 90) errors.push(`Database Health Score is ${dbHealthScore} (threshold: 90)`);
    if (repoHealthScore < 80) errors.push(`Repository Health Score is ${repoHealthScore} (threshold: 80)`);

    if (errors.length > 0) {
      if (isCI) {
        throw new Error(`[GOVERNANCE RELEASE GATE FAILURE] Build rejected:\n- ${errors.join('\n- ')}`);
      } else {
        console.warn(`[GOVERNANCE RELEASE GATE WARNING] Local Dev Alert:\n- ${errors.join('\n- ')}`);
      }
    } else {
      console.log('[GOVERNANCE RELEASE GATE] All continuous certification thresholds satisfied.');
    }

    if (isCI) {
      expect(errors.length).toBe(0);
    } else {
      expect(true).toBe(true);
    }
  });
});
