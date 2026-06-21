import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

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

describe('Certification Drift Protection Verification', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const sharedDir = path.join(rootDir, 'shared/copilot');
  const baselinePath = path.join(rootDir, 'benchmarks/certification-baseline.json');

  it('should ensure active file checksums match the baseline checksums exactly', () => {
    expect(fs.existsSync(baselinePath)).toBe(true);
    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));

    const graphsPath = path.join(sharedDir, 'scenario-graphs/graphs.json');
    const certifiedWorkflowsPath = path.join(sharedDir, 'governance/certified-workflows.json');
    const replaysPath = path.join(rootDir, 'benchmarks/real_conversation_replays.json');
    const knowledgeDir = path.join(sharedDir, 'knowledge');
    const playbooksDir = path.join(sharedDir, 'playbooks');

    const currentGraphChecksum = getHash(graphsPath);
    const currentRegistryChecksum = getHash(graphsPath);
    const currentWorkflowMatrixChecksum = getHash(certifiedWorkflowsPath);
    const currentKnowledgeChecksum = getDirHash(knowledgeDir);
    const currentPlaybookChecksum = getDirHash(playbooksDir);
    const currentReplayChecksum = getHash(replaysPath);

    expect(currentGraphChecksum).toBe(baseline.graphChecksum);
    expect(currentRegistryChecksum).toBe(baseline.registryChecksum);
    expect(currentWorkflowMatrixChecksum).toBe(baseline.workflowMatrixChecksum);
    expect(currentKnowledgeChecksum).toBe(baseline.knowledgeChecksum);
    expect(currentPlaybookChecksum).toBe(baseline.playbookChecksum);
    expect(currentReplayChecksum).toBe(baseline.replayChecksum);
  });
});
