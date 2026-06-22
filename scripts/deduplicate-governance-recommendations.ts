import * as fs from 'fs';
import * as path from 'path';

const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(WORKSPACE_ROOT, 'storage', 'reports');

function main() {
  console.log('Deduplicating governance recommendations...');

  let recommendations: any[] = [];
  try {
    const recPath = path.join(REPORTS_DIR, 'governance-recommendations.json');
    if (fs.existsSync(recPath)) {
      recommendations = JSON.parse(fs.readFileSync(recPath, 'utf8'));
    }
  } catch (e) {}

  const seen = new Set<string>();
  const deduplicated: any[] = [];
  let duplicatesCount = 0;

  for (const rec of recommendations) {
    // Generate a unique fingerprint for each recommendation based on its category, type, and short description snippet
    const descSnippet = rec.description ? rec.description.substring(0, 30).toLowerCase() : '';
    const fingerprint = `${rec.category}_${rec.type}_${descSnippet}`;
    
    if (seen.has(fingerprint)) {
      duplicatesCount++;
    } else {
      seen.add(fingerprint);
      deduplicated.push(rec);
    }
  }

  // Update recommendations file with deduplicated list
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'governance-recommendations.json'),
    JSON.stringify(deduplicated, null, 2)
  );

  const report = {
    generatedAt: new Date().toISOString(),
    originalRecommendationsCount: recommendations.length,
    deduplicatedRecommendationsCount: deduplicated.length,
    duplicatesRemoved: duplicatesCount,
    status: "COMPLETE"
  };

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'recommendation-deduplication-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('__RECOMMENDATION_DEDUP_DONE__');
}

main();
