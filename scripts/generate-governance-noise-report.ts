import * as fs from 'fs';
import * as path from 'path';

const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(WORKSPACE_ROOT, 'storage', 'reports');

function main() {
  console.log('Generating governance noise report...');

  let totalRecommendations = 0;
  let duplicateRecommendations = 0;
  let staleRecommendations = 0;

  try {
    const dedupReport = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'recommendation-deduplication-report.json'), 'utf8'));
    totalRecommendations = dedupReport.originalRecommendationsCount || 0;
    duplicateRecommendations = dedupReport.duplicatesRemoved || 0;
  } catch (e) {}

  // Mock stale count based on backlog items older than 30 days or deferred
  try {
    const backlog = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'remediation-backlog.json'), 'utf8'));
    staleRecommendations = Array.isArray(backlog) ? backlog.filter((b: any) => b.status === 'DEFERRED').length : 0;
  } catch (e) {}

  const noiseRatio = totalRecommendations > 0 ? Number(((duplicateRecommendations + staleRecommendations) / totalRecommendations).toFixed(2)) : 0;
  const status = noiseRatio > 0.3 ? "NEEDS_ATTENTION" : "HEALTHY";

  const noiseReport = {
    totalRecommendations,
    duplicateRecommendations,
    staleRecommendations,
    noiseRatio,
    status,
    generatedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'governance-noise-report.json'),
    JSON.stringify(noiseReport, null, 2)
  );

  // History tracking
  const historyPath = path.join(REPORTS_DIR, 'governance-noise-history.json');
  let history: any[] = [];
  if (fs.existsSync(historyPath)) {
    try {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      if (!Array.isArray(history)) history = [];
    } catch (e) {}
  }
  history.push(noiseReport);
  if (history.length > 500) history = history.slice(-500);
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

  console.log('__GOVERNANCE_NOISE_DONE__');
}

main();
