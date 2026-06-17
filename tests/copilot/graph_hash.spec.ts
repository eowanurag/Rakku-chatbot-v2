import { ScenarioGraphEngine } from '../../backend/src/copilot/sre/resolver/scenario-graph.engine';

describe('SRE Graph Hashing Auditability', () => {
  it('should generate a valid SHA256 checksum from graph definition', () => {
    const engine = new ScenarioGraphEngine('shared/copilot');
    const hash = engine.getGraphHash();
    
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64); // Hex length of SHA256
    
    // Rerunning load yields identical hash
    const engine2 = new ScenarioGraphEngine('shared/copilot');
    expect(engine2.getGraphHash()).toBe(hash);
  });
});
