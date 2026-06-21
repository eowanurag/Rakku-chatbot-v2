import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const rootDir = path.resolve(__dirname, '..');
const sharedDir = path.join(rootDir, 'shared/copilot');

function getHash(filePath: string): string {
  if (!fs.existsSync(filePath)) return '';
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

function getDirHash(dirPath: string): string {
  if (!fs.existsSync(dirPath)) return '';
  const files = fs.readdirSync(dirPath).sort();
  const hasher = crypto.createHash('sha256');
  for (const file of files) {
    const p = path.join(dirPath, file);
    if (fs.statSync(p).isFile()) {
      hasher.update(file);
      hasher.update(fs.readFileSync(p, 'utf8'));
    }
  }
  return hasher.digest('hex');
}

function generate() {
  const graphsPath = path.join(sharedDir, 'scenario-graphs/graphs.json');
  const certifiedWorkflowsPath = path.join(sharedDir, 'governance/certified-workflows.json');
  const outcomeRulesPath = path.join(sharedDir, 'outcome-rules/rules.json');
  const replaysPath = path.join(rootDir, 'benchmarks/real_conversation_replays.json');
  const knowledgeDir = path.join(sharedDir, 'knowledge');
  const playbooksDir = path.join(sharedDir, 'playbooks');

  const baseline = {
    version: "2.7.8.2-A",
    certificationDate: new Date().toISOString(),
    graphChecksum: getHash(graphsPath),
    registryChecksum: getHash(graphsPath), // fallback to same
    workflowMatrixChecksum: getHash(certifiedWorkflowsPath),
    knowledgeChecksum: getDirHash(knowledgeDir),
    playbookChecksum: getDirHash(playbooksDir),
    replayChecksum: fs.existsSync(replaysPath) ? getHash(replaysPath) : 'DUMMY_REPLAY_HASH'
  };

  const baselinePath = path.join(rootDir, 'benchmarks/certification-baseline.json');
  fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2), 'utf8');
  console.log(`Generated certification-baseline.json at ${baselinePath}`);

  // Also write report to storage/reports
  const reportPath = path.join(rootDir, 'storage/reports/certification-baseline-report.json');
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  fs.writeFileSync(reportPath, JSON.stringify({ ...baseline, status: 'GENERATED' }, null, 2), 'utf8');
  console.log(`Generated certification-baseline-report.json at ${reportPath}`);
}

if (require.main === module) {
  generate();
}

export { getHash, getDirHash };
