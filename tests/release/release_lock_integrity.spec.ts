import * as fs from 'fs';
import * as path from 'path';

describe('Release Lock Integrity Validation', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const releaseLockManifestPath = path.join(rootDir, 'benchmarks/release-lock-manifest.json');
  const sentinelIncidentsPath = path.join(rootDir, 'config/release-validation/sentinel-incidents.json');
  const productionIncidentsPath = path.join(rootDir, 'benchmarks/production_incidents.json');
  const certifiedWorkflowsPath = path.join(rootDir, 'shared/copilot/governance/certified-workflows.json');
  const conversationManifestPath = path.join(rootDir, 'benchmarks/conversation_manifest.json');
  const replaysPath = path.join(rootDir, 'benchmarks/real_conversation_replays.json');

  it('should verify the release lock manifest and all baseline file configurations', () => {
    // 1. Files existence
    expect(fs.existsSync(releaseLockManifestPath)).toBe(true);
    expect(fs.existsSync(sentinelIncidentsPath)).toBe(true);
    expect(fs.existsSync(productionIncidentsPath)).toBe(true);
    expect(fs.existsSync(certifiedWorkflowsPath)).toBe(true);
    expect(fs.existsSync(conversationManifestPath)).toBe(true);
    expect(fs.existsSync(replaysPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(releaseLockManifestPath, 'utf8'));
    const conversationManifest = JSON.parse(fs.readFileSync(conversationManifestPath, 'utf8'));
    const replays = JSON.parse(fs.readFileSync(replaysPath, 'utf8'));
    const sentinels = JSON.parse(fs.readFileSync(sentinelIncidentsPath, 'utf8'));
    const certified = JSON.parse(fs.readFileSync(certifiedWorkflowsPath, 'utf8'));

    // 2. Count matches
    expect(manifest.version).toBe('2.7.8.2-A');
    expect(manifest.releaseLocked).toBe(true);
    expect(manifest.conversationReplayCount).toBe(replays.length);
    expect(manifest.sentinelIncidentCount).toBe(sentinels.length);
    expect(manifest.certifiedWorkflowCount).toBe(Object.keys(certified).length);

    // 3. Checksums/integrity status
    expect(manifest.checksum).toBeDefined();
  });
});
