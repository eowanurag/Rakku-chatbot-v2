import * as fs from 'fs';
import * as path from 'path';

const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(WORKSPACE_ROOT, 'storage', 'reports');

function main() {
  console.log('Generating governance summary report...');

  let repositoryHealthScore = 100;
  let databaseHealthScore = 100;
  let technicalDebtScore = 0;
  let repositoryDrift = 'HEALTHY';
  let databaseDrift = 'HEALTHY';
  let criticalIssues = 0;
  let openRecommendations = 0;

  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'repository-manifest.json'), 'utf8'));
    repositoryHealthScore = manifest.repositoryHealthScore ?? 100;
  } catch (e) {}

  try {
    const dbReport = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'database-remediation-report.json'), 'utf8'));
    // Calculate database score dynamically
    const duplicateRecords = dbReport.duplicateRecords || 0;
    const orphanRecords = dbReport.orphanRecords || 0;
    const missingIndexes = (dbReport.missingIndexes || []).length;
    databaseHealthScore = Math.max(0, 100 - (duplicateRecords * 10) - (orphanRecords * 5) - (missingIndexes * 2));
    
    if (duplicateRecords > 0) criticalIssues++;
    if (orphanRecords > 0) criticalIssues++;
  } catch (e) {}

  try {
    const debtReport = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'technical-debt-report.json'), 'utf8'));
    technicalDebtScore = debtReport.debtScore ?? 0;
  } catch (e) {}

  try {
    const repoDriftReport = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'repository-drift-report.json'), 'utf8'));
    repositoryDrift = repoDriftReport.severity || 'HEALTHY';
    if (repositoryDrift === 'CRITICAL') criticalIssues++;
  } catch (e) {}

  try {
    const dbTrend = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'database-trend-report.json'), 'utf8'));
    databaseDrift = dbTrend.databaseDrift || 'HEALTHY';
    if (databaseDrift === 'CRITICAL') criticalIssues++;
  } catch (e) {}

  try {
    const registry = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'remediation-registry.json'), 'utf8'));
    openRecommendations = Array.isArray(registry) ? registry.filter((r: any) => r.status === 'PENDING').length : 0;
  } catch (e) {}

  const status = criticalIssues > 0 ? "CRITICAL" : (repositoryHealthScore < 85 || databaseHealthScore < 90) ? "NEEDS_ATTENTION" : "HEALTHY";

  const summary = {
    generatedAt: new Date().toISOString(),
    repositoryHealthScore,
    databaseHealthScore,
    technicalDebtScore,
    repositoryDrift,
    databaseDrift,
    criticalIssues,
    openRecommendations,
    estimatedCleanupHours: Math.round(technicalDebtScore * 0.15),
    status,
    lastAuditTime: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'governance-summary.json'),
    JSON.stringify(summary, null, 2)
  );

  // Append history
  const historyPath = path.join(REPORTS_DIR, 'governance-summary-history.json');
  let history: any[] = [];
  if (fs.existsSync(historyPath)) {
    try {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      if (!Array.isArray(history)) history = [];
    } catch (e) {}
  }

  history.push(summary);
  if (history.length > 500) history = history.slice(-500);

  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

  console.log('__GOVERNANCE_SUMMARY_DONE__');
}

main();
