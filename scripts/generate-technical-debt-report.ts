import * as fs from 'fs';
import * as path from 'path';

const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(WORKSPACE_ROOT, 'storage', 'reports');

function main() {
  console.log('Generating technical debt score report...');

  let deadCode = 0;
  let orphanFiles = 0;
  let duplicateModules = 0;
  let missingIndexes = 0;
  let obsoleteTests = 0;
  let dependencyIssues = 0;

  try {
    const deadCodeData = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'dead-code-report.json'), 'utf8'));
    deadCode = Array.isArray(deadCodeData) ? deadCodeData.length : 0;
  } catch (e) {}

  try {
    const orphanFilesData = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'unused-files-report.json'), 'utf8'));
    orphanFiles = Array.isArray(orphanFilesData) ? orphanFilesData.length : 0;
  } catch (e) {}

  try {
    const moduleConsolidation = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'module-consolidation-plan.json'), 'utf8'));
    duplicateModules = Array.isArray(moduleConsolidation.candidates) ? moduleConsolidation.candidates.length : 0;
  } catch (e) {}

  try {
    const dbReport = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'database-remediation-report.json'), 'utf8'));
    missingIndexes = Array.isArray(dbReport.missingIndexes) ? dbReport.missingIndexes.length : 0;
  } catch (e) {}

  try {
    const testCleanup = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'test-cleanup-plan.json'), 'utf8'));
    obsoleteTests = Array.isArray(testCleanup.tests) ? testCleanup.tests.length : 0;
  } catch (e) {}

  try {
    const depAudit = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'dependency-audit.json'), 'utf8'));
    const missing = Array.isArray(depAudit.missingDependencies) ? depAudit.missingDependencies.length : 0;
    const unused = Array.isArray(depAudit.unusedDependencies) ? depAudit.unusedDependencies.length : 0;
    dependencyIssues = missing + unused;
  } catch (e) {}

  // Calculate Technical Debt Score
  const score = (deadCode * 2) + orphanFiles + (duplicateModules * 5) + (missingIndexes * 3) + obsoleteTests + (dependencyIssues * 2);

  let classification = "HEALTHY";
  if (score > 60) classification = "CRITICAL";
  else if (score > 40) classification = "NEEDS_ATTENTION";
  else if (score > 20) classification = "WARNING";

  const debtReport = {
    generatedAt: new Date().toISOString(),
    debtScore: score,
    classification,
    breakdown: {
      deadCodeCount: deadCode,
      orphanFilesCount: orphanFiles,
      duplicateModulesCount: duplicateModules,
      missingIndexesCount: missingIndexes,
      obsoleteTestsCount: obsoleteTests,
      dependencyIssuesCount: dependencyIssues
    }
  };

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'technical-debt-report.json'),
    JSON.stringify(debtReport, null, 2)
  );

  console.log('__TECHNICAL_DEBT_DONE__');
}

main();
