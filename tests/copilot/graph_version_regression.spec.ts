import { ScenarioGraphEngine } from '../../backend/src/copilot/sre/resolver/scenario-graph.engine';

describe('SRE Graph Version Regression & Compatibility', () => {
  it('should traverse legacy scenario structures safely without throwing errors', () => {
    // We instantiate graph engine with a mock base path or simulate backward compatibility
    const engine = new ScenarioGraphEngine('shared/copilot');
    
    // Check if we can safely resolve paths even if key names are old format
    const res = engine.resolvePath(["OLD_INTENT_KEY"]);
    
    expect(res).toBeDefined();
    expect(res.scenario).toBe("OLD_INTENT_KEY");
    expect(res.requiresImmediateEscalation).toBe(false);
  });
});
