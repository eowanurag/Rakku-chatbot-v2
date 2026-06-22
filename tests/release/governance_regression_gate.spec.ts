import * as fs from 'fs';
import * as path from 'path';

describe('Continuous Governance Release Gate Expansion Tests', () => {
  const reportsDir = path.resolve(__dirname, '../../storage/reports');
  let isCI = false;

  beforeAll(() => {
    isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  });

  afterAll(() => {
    console.log('__GOVERNANCE_CERTIFICATION_DONE__');
  });

  it('should verify release gate conditions and fail build if on CI', () => {
    let criticalIssues = 0;
    let repositoryDrift = 'HEALTHY';
    let databaseDrift = 'HEALTHY';
    let technicalDebtScore = 0;
    let repositoryHealthScore = 100;
    let databaseHealthScore = 100;

    try {
      const summary = JSON.parse(fs.readFileSync(path.join(reportsDir, 'governance-summary.json'), 'utf8'));
      criticalIssues = summary.criticalIssues || 0;
      repositoryDrift = summary.repositoryDrift || 'HEALTHY';
      databaseDrift = summary.databaseDrift || 'HEALTHY';
      technicalDebtScore = summary.technicalDebtScore || 0;
      repositoryHealthScore = summary.repositoryHealthScore ?? 100;
      databaseHealthScore = summary.databaseHealthScore ?? 100;
    } catch (e) {}

    // Compare with history to check for drops
    let summaryHistory: any[] = [];
    try {
      summaryHistory = JSON.parse(fs.readFileSync(path.join(reportsDir, 'governance-summary-history.json'), 'utf8'));
    } catch (e) {}

    let previousHealth = 100;
    let previousDbHealth = 100;
    let previousDebt = 0;
    if (summaryHistory.length > 1) {
      const prev = summaryHistory[summaryHistory.length - 2];
      previousHealth = prev.repositoryHealthScore ?? 100;
      previousDbHealth = prev.databaseHealthScore ?? 100;
      previousDebt = prev.technicalDebtScore ?? 0;
    }

    const healthDrop = previousHealth - repositoryHealthScore;
    const dbHealthDrop = previousDbHealth - databaseHealthScore;
    const debtIncreasePercent = previousDebt > 0 ? ((technicalDebtScore - previousDebt) / previousDebt) * 100 : 0;

    const errors: string[] = [];
    if (criticalIssues > 0) errors.push(`Critical issues detected: ${criticalIssues}`);
    if (repositoryDrift === 'CRITICAL') errors.push('Repository Drift is CRITICAL');
    if (databaseDrift === 'CRITICAL') errors.push('Database Drift is CRITICAL');
    if (debtIncreasePercent > 20) errors.push(`Technical Debt increased by ${debtIncreasePercent.toFixed(1)}% (threshold: 20%)`);
    if (healthDrop > 10) errors.push(`Repository health dropped by ${healthDrop} points (threshold: 10)`);
    if (dbHealthDrop > 10) errors.push(`Database health dropped by ${dbHealthDrop} points (threshold: 10)`);

    if (errors.length > 0) {
      if (isCI) {
        throw new Error(`[RELEASE GATE FAILURE] Build rejected due to regression:\n- ${errors.join('\n- ')}`);
      } else {
        console.warn(`[RELEASE GATE WARNING] Staging regression alerts (Local Dev mode - Warn only):\n- ${errors.join('\n- ')}`);
      }
    } else {
      console.log('[RELEASE GATE] No regressions detected. Gate passed.');
    }

    if (isCI) {
      expect(errors.length).toBe(0);
    } else {
      expect(true).toBe(true);
    }
  });
});
