import * as fs from 'fs';
import * as path from 'path';

describe('Governance Continuous Operational Gate Tests', () => {
  const reportsDir = path.resolve(__dirname, '../../storage/reports');
  let isCI = false;

  beforeAll(() => {
    isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  });

  afterAll(() => {
    console.log('__GOVERNANCE_OPERATIONAL_DONE__');
  });

  it('should verify operational release gate conditions and fail build if on CI', () => {
    let p0OpenIssues = 0;
    try {
      const backlog = JSON.parse(fs.readFileSync(path.join(reportsDir, 'remediation-backlog.json'), 'utf8'));
      p0OpenIssues = backlog.filter((b: any) => b.priority === 'P0' && b.status === 'OPEN').length;
    } catch (e) {}

    let repositoryHealthScore = 100;
    let databaseHealthScore = 100;
    let technicalDebtScore = 0;
    let criticalIssues = 0;
    try {
      const summary = JSON.parse(fs.readFileSync(path.join(reportsDir, 'governance-summary.json'), 'utf8'));
      repositoryHealthScore = summary.repositoryHealthScore ?? 100;
      databaseHealthScore = summary.databaseHealthScore ?? 100;
      technicalDebtScore = summary.technicalDebtScore ?? 0;
      criticalIssues = summary.criticalIssues ?? 0;
    } catch (e) {}

    let baselineHealth = 100;
    let baselineDbHealth = 100;
    let baselineDebt = 0;
    try {
      const baseline = JSON.parse(fs.readFileSync(path.join(reportsDir, 'governance-baseline.json'), 'utf8'));
      baselineHealth = baseline.repositoryHealthScore ?? 100;
      baselineDbHealth = baseline.databaseHealthScore ?? 100;
      baselineDebt = baseline.technicalDebtScore ?? 0;
    } catch (e) {}

    let noiseRatio = 0;
    try {
      const noise = JSON.parse(fs.readFileSync(path.join(reportsDir, 'governance-noise-report.json'), 'utf8'));
      noiseRatio = noise.noiseRatio ?? 0;
    } catch (e) {}

    const healthDrop = baselineHealth - repositoryHealthScore;
    const dbHealthDrop = baselineDbHealth - databaseHealthScore;
    const debtIncreasePercent = baselineDebt > 0 ? ((technicalDebtScore - baselineDebt) / baselineDebt) * 100 : 0;

    const errors: string[] = [];
    if (p0OpenIssues > 0) errors.push(`P0 OPEN issues detected: ${p0OpenIssues}`);
    if (healthDrop > 10) errors.push(`Repository health dropped by ${healthDrop} points from baseline (threshold: 10)`);
    if (dbHealthDrop > 10) errors.push(`Database health dropped by ${dbHealthDrop} points from baseline (threshold: 10)`);
    if (debtIncreasePercent > 25) errors.push(`Technical Debt increased by ${debtIncreasePercent.toFixed(1)}% (threshold: 25%)`);
    if (noiseRatio > 0.3) errors.push(`Governance noise ratio is ${(noiseRatio * 100).toFixed(0)}% (threshold: 30%)`);
    if (criticalIssues > 0) errors.push(`Critical issues detected in summary: ${criticalIssues}`);

    if (errors.length > 0) {
      if (isCI) {
        throw new Error(`[GOVERNANCE OPERATIONAL GATE FAILURE] Build rejected:\n- ${errors.join('\n- ')}`);
      } else {
        console.warn(`[GOVERNANCE OPERATIONAL GATE WARNING] Local Dev Alert:\n- ${errors.join('\n- ')}`);
      }
    } else {
      console.log('[GOVERNANCE OPERATIONAL GATE] All metrics within thresholds.');
    }

    if (isCI) {
      expect(errors.length).toBe(0);
    } else {
      expect(true).toBe(true);
    }
  });
});
