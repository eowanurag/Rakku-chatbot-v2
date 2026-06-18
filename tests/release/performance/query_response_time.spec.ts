import * as fs from 'fs';
import * as path from 'path';
import { ScenarioGraphEngine } from '../../../backend/src/copilot/sre/resolver/scenario-graph.engine';

/**
 * Query Response Time SLA Test
 *
 * Enforces response time budgets defined in performance-thresholds.json:
 *   - simpleQuery: 500ms
 *   - mediumQuery: 1500ms
 *   - graphTraversal: 200ms
 *
 * Severity: MEDIUM – response time regression is a warning, not a blocker.
 */

const thresholds = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../config/release-validation/performance-thresholds.json'), 'utf8')
);

describe('Query Response Time SLA', () => {
  let graphEngine: ScenarioGraphEngine;

  beforeAll(() => {
    graphEngine = new ScenarioGraphEngine('shared/copilot');
  });

  it('should resolve a simple graph traversal within graphTraversal threshold', () => {
    const start = Date.now();
    graphEngine.traverseFromSeeds(['LOSS', 'DOCUMENT', 'AADHAAR']);
    const elapsed = Date.now() - start;

    console.log(`[Response Time] Simple traversal: ${elapsed}ms (Budget: ${thresholds.graphTraversal}ms)`);
    expect(elapsed).toBeLessThan(thresholds.graphTraversal);
  });

  it('should resolve 100 sequential traversals within simpleQuery total budget', () => {
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      graphEngine.traverseFromSeeds(['FRAUD', 'UPI']);
    }
    const elapsed = Date.now() - start;
    const avgMs = elapsed / 100;

    console.log(`[Response Time] 100 traversals: ${elapsed}ms total, ${avgMs.toFixed(2)}ms avg (Budget: ${thresholds.simpleQuery}ms total)`);
    expect(elapsed).toBeLessThan(thresholds.simpleQuery);
  });

  it('should resolve graph data loading within graphTraversal threshold', () => {
    const start = Date.now();
    const data = graphEngine.getGraphData();
    const elapsed = Date.now() - start;

    expect(data).toBeDefined();
    expect(data.nodes).toBeDefined();

    console.log(`[Response Time] Graph data load: ${elapsed}ms (Budget: ${thresholds.graphTraversal}ms)`);
    expect(elapsed).toBeLessThan(thresholds.graphTraversal);
  });

  it('should compute completeness within graphTraversal threshold', () => {
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      graphEngine.calculateCompleteness('AADHAAR', { documentType: 'aadhaar', where: 'market' }, ['documentType', 'where', 'when']);
    }
    const elapsed = Date.now() - start;

    console.log(`[Response Time] 100 completeness calculations: ${elapsed}ms (Budget: ${thresholds.graphTraversal}ms)`);
    expect(elapsed).toBeLessThan(thresholds.graphTraversal);
  });

  it('should compute graph hash within graphTraversal threshold', () => {
    const start = Date.now();
    const hash = graphEngine.getGraphHash();
    const elapsed = Date.now() - start;

    expect(hash).toBeDefined();
    expect(hash.length).toBeGreaterThan(0);

    console.log(`[Response Time] Graph hash: ${elapsed}ms (Budget: ${thresholds.graphTraversal}ms)`);
    expect(elapsed).toBeLessThan(thresholds.graphTraversal);
  });
});
