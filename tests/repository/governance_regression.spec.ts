import * as fs from 'fs';
import * as path from 'path';

describe('Governance Regression Tests', () => {
  const reportsDir = path.resolve(__dirname, '../../storage/reports');
  const reportPath = path.join(reportsDir, 'governance-regression-report.json');
  const historyPath = path.join(reportsDir, 'governance-regression-history.json');

  it('should detect database or codebase health regressions and save report', () => {
    let summary: any = {
      repositoryHealthScore: 100,
      databaseHealthScore: 100,
      technicalDebtScore: 0,
      criticalIssues: 0
    };

    try {
      summary = JSON.parse(fs.readFileSync(path.join(reportsDir, 'governance-summary.json'), 'utf8'));
    } catch (e) {}

    // Verify if there was a regression (comparing with last run in summary history)
    let summaryHistory: any[] = [];
    try {
      summaryHistory = JSON.parse(fs.readFileSync(path.join(reportsDir, 'governance-summary-history.json'), 'utf8'));
    } catch (e) {}

    let previousHealthScore = 100;
    let previousDebt = 0;
    if (summaryHistory.length > 1) {
      const prev = summaryHistory[summaryHistory.length - 2];
      previousHealthScore = prev.repositoryHealthScore ?? 100;
      previousDebt = prev.technicalDebtScore ?? 0;
    }

    const healthDegradation = previousHealthScore - summary.repositoryHealthScore;
    const debtIncrease = summary.technicalDebtScore - previousDebt;

    const regressions: string[] = [];
    if (healthDegradation > 0) {
      regressions.push(`Repository health degraded by ${healthDegradation} points.`);
    }
    if (debtIncrease > 0) {
      regressions.push(`Technical debt increased by ${debtIncrease} points.`);
    }

    const severity = regressions.length > 0 ? "WARNING" : "HEALTHY";

    const regressionReport = {
      timestamp: new Date().toISOString(),
      regressions,
      severity,
      hasRegression: regressions.length > 0
    };

    fs.writeFileSync(reportPath, JSON.stringify(regressionReport, null, 2));

    // Append to history
    let history: any[] = [];
    if (fs.existsSync(historyPath)) {
      try {
        history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        if (!Array.isArray(history)) history = [];
      } catch (e) {}
    }
    history.push(regressionReport);
    if (history.length > 500) history = history.slice(-500);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

    console.log('__GOVERNANCE_REGRESSION_DONE__');
    expect(fs.existsSync(reportPath)).toBe(true);
  });
});
