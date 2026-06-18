import * as fs from 'fs';
import * as path from 'path';

/**
 * Graph Regression Test
 *
 * Verifies:
 *   1. Node count has not decreased compared to baseline
 *   2. All baseline roots are present
 *   3. All baseline node keys are still present (no accidental deletion of paths)
 */
describe('SRE Graph Regression Validation', () => {
  const findSharedFile = (filename: string): string => {
    let p = path.resolve(process.cwd(), 'shared/copilot', filename);
    if (fs.existsSync(p)) return p;
    p = path.resolve(process.cwd(), '../shared/copilot', filename);
    if (fs.existsSync(p)) return p;
    for (let i = 1; i <= 5; i++) {
      const dots = '../'.repeat(i);
      p = path.resolve(__dirname, dots, 'shared/copilot', filename);
      if (fs.existsSync(p)) return p;
    }
    return path.resolve(__dirname, filename);
  };

  it('should not deviate from the baseline graph-baseline.json', () => {
    const baselinePath = path.resolve(__dirname, '../../../snapshots/graph-baseline.json');
    const graphsPath = findSharedFile('scenario-graphs/graphs.json');

    expect(fs.existsSync(baselinePath)).toBe(true);
    expect(fs.existsSync(graphsPath)).toBe(true);

    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    const currentGraph = JSON.parse(fs.readFileSync(graphsPath, 'utf8'));

    const currentNodes = currentGraph.nodes || {};
    const activeNodes = Object.keys(currentNodes).filter(key => currentNodes[key].status === 'ACTIVE');

    console.log(`[Graph Regression Check]`);
    console.log(`  Baseline Active Nodes: ${baseline.totalActiveNodes}`);
    console.log(`  Current Active Nodes: ${activeNodes.length}`);

    // Roots must match
    for (const root of baseline.roots) {
      expect(currentGraph.roots).toContain(root);
    }

    // Node count must not decrease
    expect(activeNodes.length).toBeGreaterThanOrEqual(baseline.totalActiveNodes);

    // Node keys must remain
    for (const key of baseline.nodeKeys) {
      expect(activeNodes).toContain(key);
    }
  });
});
