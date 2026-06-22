import * as fs from 'fs';
import * as path from 'path';

const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(WORKSPACE_ROOT, 'storage', 'reports');

function main() {
  console.log('Generating technical debt trend analytics...');

  let technicalDebtScore = 82;
  try {
    const debtReport = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'technical-debt-report.json'), 'utf8'));
    technicalDebtScore = debtReport.debtScore ?? technicalDebtScore;
  } catch (e) {}

  // Read summary history to calculate velocity and burn rate
  let history: any[] = [];
  try {
    const summaryHistory = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'governance-summary-history.json'), 'utf8'));
    history = Array.isArray(summaryHistory) ? summaryHistory : [];
  } catch (e) {}

  let previousScore = technicalDebtScore;
  if (history.length > 1) {
    const prev = history[history.length - 2];
    previousScore = prev.technicalDebtScore ?? technicalDebtScore;
  }

  const debtVelocity = technicalDebtScore - previousScore;
  const debtBurnRate = debtVelocity < 0 ? Math.abs(debtVelocity) : 0;
  const daysToHealthyState = debtBurnRate > 0 ? Math.ceil(technicalDebtScore / debtBurnRate) * 7 : 0; // assuming weekly audit intervals

  const trendReport = {
    debtVelocity,
    debtBurnRate,
    daysToHealthyState,
    trend: debtVelocity < 0 ? "IMPROVING" : debtVelocity > 0 ? "DEGRADING" : "STABLE",
    generatedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'technical-debt-trend.json'),
    JSON.stringify(trendReport, null, 2)
  );

  // Append history
  const historyPath = path.join(REPORTS_DIR, 'technical-debt-trend-history.json');
  let trendHistory: any[] = [];
  if (fs.existsSync(historyPath)) {
    try {
      trendHistory = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      if (!Array.isArray(trendHistory)) trendHistory = [];
    } catch (e) {}
  }
  trendHistory.push(trendReport);
  if (trendHistory.length > 500) trendHistory = trendHistory.slice(-500);
  fs.writeFileSync(historyPath, JSON.stringify(trendHistory, null, 2));

  console.log('__TECHNICAL_DEBT_TREND_DONE__');
}

main();
