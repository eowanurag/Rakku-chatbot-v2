import { ScenarioGraphEngine } from '../../backend/src/copilot/sre/resolver/scenario-graph.engine';

describe('SRE Scenario Path Resolution & Cache', () => {
  let engine: ScenarioGraphEngine;

  beforeEach(() => {
    engine = new ScenarioGraphEngine('shared/copilot');
  });

  it('should traverse deterministic paths starting from seed nodes', () => {
    const res = engine.traverseFromSeeds(["LOSS", "DOCUMENT", "AADHAAR"]);
    expect(res.path).toEqual(["LOSS", "DOCUMENT", "AADHAAR"]);
    expect(res.requiresImmediateEscalation).toBe(false);
  });

  it('should leverage in-memory cache on subsequent requests with identical keys', () => {
    const initialMetrics = engine.getCacheMetrics();
    expect(initialMetrics.hits).toBe(0);
    expect(initialMetrics.misses).toBe(0);

    engine.traverseFromSeeds(["LOSS", "MOBILE"]); // Cache Miss
    const missMetrics = engine.getCacheMetrics();
    expect(missMetrics.misses).toBe(1);
    expect(missMetrics.hits).toBe(0);

    engine.traverseFromSeeds(["LOSS", "MOBILE"]); // Cache Hit
    const hitMetrics = engine.getCacheMetrics();
    expect(hitMetrics.misses).toBe(1);
    expect(hitMetrics.hits).toBe(1);
  });

  it('should bounds-limit cache capacity and evict oldest entry if size exceed 1000', () => {
    // Fill cache to 1000 entries
    for (let i = 0; i < 1000; i++) {
      engine.traverseFromSeeds([`TEST_NODE_${i}`]);
    }

    // Cache hit on the first one works right now
    engine.traverseFromSeeds(["TEST_NODE_1"]); // This triggers a cache hit

    // Adding 1 more entry to exceed 1000 size (should trigger eviction of oldest entry TEST_NODE_0)
    engine.traverseFromSeeds(["NEW_NODE"]);

    // Let's verify oldest entry was evicted (so querying it again results in a miss)
    const metricsBefore = engine.getCacheMetrics();
    engine.traverseFromSeeds(["TEST_NODE_0"]); // Should be a Cache Miss again because it was evicted
    const metricsAfter = engine.getCacheMetrics();
    
    expect(metricsAfter.misses).toBe(metricsBefore.misses + 1);
  });
});
