import * as fs from 'fs';
import * as path from 'path';

const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(WORKSPACE_ROOT, 'storage', 'reports');

function main() {
  console.log('Generating governance recommendations...');

  const recommendations: any[] = [];

  // Parse missing indexes from database remediation plan
  try {
    const dbPlan = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'database-remediation-plan.json'), 'utf8'));
    if (dbPlan.missingIndexes) {
      dbPlan.missingIndexes.forEach((idx: any, i: number) => {
        recommendations.push({
          id: `REC-DB-${String(i+1).padStart(3, '0')}`,
          priority: "P0",
          category: "DATABASE",
          type: "MISSING_INDEX",
          description: `Create missing index ${idx.suggestedIndexName} on table ${idx.table} column ${idx.column}.`,
          estimatedGain: "15%",
          estimatedEffort: "1h"
        });
      });
    }
  } catch (e) {}

  // Parse orphan files from certification report
  try {
    const orphanCert = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'orphan-file-certification.json'), 'utf8'));
    if (orphanCert.safeToDelete && orphanCert.safeToDelete.length > 0) {
      recommendations.push({
        id: "REC-REP-001",
        priority: "P2",
        category: "REPOSITORY",
        type: "ORPHAN_CLEANUP",
        description: `Safely delete ${orphanCert.safeToDelete.length} verified orphan files including state and hook files.`,
        estimatedGain: "Minimal footprint size reduction",
        estimatedEffort: "4h"
      });
    }
  } catch (e) {}

  // Parse duplicates from module consolidation plan
  try {
    const consolidation = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'module-consolidation-plan.json'), 'utf8'));
    if (consolidation.candidates) {
      consolidation.candidates.forEach((c: any, i: number) => {
        recommendations.push({
          id: `REC-ARCH-${String(i+1).padStart(3, '0')}`,
          priority: "P1",
          category: "ARCHITECTURE",
          type: "DUPLICATE_CONSOLIDATION",
          description: c.recommendation,
          estimatedGain: "De-duplicate logic and prevent runtime sync divergence",
          estimatedEffort: "3h"
        });
      });
    }
  } catch (e) {}

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'governance-recommendations.json'),
    JSON.stringify(recommendations, null, 2)
  );

  // Append history
  const historyPath = path.join(REPORTS_DIR, 'governance-recommendation-history.json');
  let history: any[] = [];
  if (fs.existsSync(historyPath)) {
    try {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      if (!Array.isArray(history)) history = [];
    } catch (e) {}
  }

  history.push({
    timestamp: new Date().toISOString(),
    recommendationsCount: recommendations.length,
    p0Count: recommendations.filter(r => r.priority === 'P0').length
  });
  if (history.length > 500) history = history.slice(-500);

  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

  console.log('__GOVERNANCE_RECOMMENDATIONS_DONE__');
}

main();
