import { ScenarioGraphEngine } from '../../../backend/src/copilot/sre/resolver/scenario-graph.engine';

/**
 * Cache Integrity Test
 *
 * Verifies:
 *   1. Eviction limits are enforced (max 1000 entries)
 *   2. Stale cache entries do not produce incorrect results
 *   3. Session boundaries are respected (different sessions don't share cache state)
 *   4. Cache hits return identical results to cache misses
 *
 * Severity: HIGH – cache corruption causes silent incorrect resolutions.
 */

describe('Cache Integrity & Eviction Validation', () => {
  it('should produce identical results from cache hit vs cache miss', () => {
    const engine = new ScenarioGraphEngine('shared/copilot');

    // First call → cache miss
    const result1 = engine.traverseFromSeeds(['LOSS', 'DOCUMENT', 'AADHAAR']);
    const metrics1 = engine.getCacheMetrics();
    expect(metrics1.misses).toBe(1);

    // Second call → cache hit
    const result2 = engine.traverseFromSeeds(['LOSS', 'DOCUMENT', 'AADHAAR']);
    const metrics2 = engine.getCacheMetrics();
    expect(metrics2.hits).toBe(1);

    // Results must be identical
    expect(result1.path).toEqual(result2.path);
    expect(result1.requiresImmediateEscalation).toBe(result2.requiresImmediateEscalation);
  });

  it('should enforce eviction when cache exceeds 1000 entries', () => {
    const engine = new ScenarioGraphEngine('shared/copilot');

    // Fill the cache with 1001 unique entries
    for (let i = 0; i <= 1000; i++) {
      engine.traverseFromSeeds([`UNIQUE_KEY_${i}`]);
    }

    const metrics = engine.getCacheMetrics();

    // All 1001 should be misses
    expect(metrics.misses).toBe(1001);

    // Query the first entry again — it should have been evicted
    engine.traverseFromSeeds(['UNIQUE_KEY_0']);
    const metricsAfter = engine.getCacheMetrics();

    // If it was evicted, it's another miss; if still cached, it's a hit
    // Since we inserted 1001 entries with max 1000, the first one should be evicted
    expect(metricsAfter.misses).toBe(1002);
  });

  it('should isolate cache between separate engine instances', () => {
    const engine1 = new ScenarioGraphEngine('shared/copilot');
    const engine2 = new ScenarioGraphEngine('shared/copilot');

    engine1.traverseFromSeeds(['LOSS', 'DOCUMENT']);
    const metrics1 = engine1.getCacheMetrics();
    expect(metrics1.misses).toBe(1);

    // Engine 2 should not share cache with engine 1
    engine2.traverseFromSeeds(['LOSS', 'DOCUMENT']);
    const metrics2 = engine2.getCacheMetrics();
    expect(metrics2.misses).toBe(1);
    expect(metrics2.hits).toBe(0);
  });

  it('should differentiate cache keys by seed order and content', () => {
    const engine = new ScenarioGraphEngine('shared/copilot');

    engine.traverseFromSeeds(['LOSS', 'DOCUMENT']);
    engine.traverseFromSeeds(['DOCUMENT', 'LOSS']);

    const metrics = engine.getCacheMetrics();

    // Different seed orders should produce different cache keys
    expect(metrics.misses).toBe(2);
  });

  it('should handle case-insensitive seeds consistently', () => {
    const engine = new ScenarioGraphEngine('shared/copilot');

    const result1 = engine.traverseFromSeeds(['loss', 'document']);
    const result2 = engine.traverseFromSeeds(['LOSS', 'DOCUMENT']);
    const result3 = engine.traverseFromSeeds(['Loss', 'Document']);

    // All should resolve identically (seeds are uppercased internally)
    expect(result1.path).toEqual(result2.path);
    expect(result2.path).toEqual(result3.path);

    const metrics = engine.getCacheMetrics();
    // All three should produce the same cache key (1 miss, 2 hits)
    expect(metrics.misses).toBe(1);
    expect(metrics.hits).toBe(2);
  });
});
