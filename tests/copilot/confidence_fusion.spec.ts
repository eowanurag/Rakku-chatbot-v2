import { ConfidenceFusionEngine } from '../../backend/src/copilot/sre/confidence-fusion.engine';

describe('ConfidenceFusionEngine', () => {
  let engine: ConfidenceFusionEngine;

  beforeAll(() => {
    engine = new ConfidenceFusionEngine();
  });

  it('should correctly fuse CUE (15%), SAE (25%), and SRE (60%) confidence levels', () => {
    const fusion = engine.fuse(0.9, 0.8, 0.95);
    
    // Calculation: (0.9 * 0.15) + (0.8 * 0.25) + (0.95 * 0.60)
    // = 0.135 + 0.20 + 0.57 = 0.905
    expect(fusion.fused).toBe(0.905);
    expect(fusion.breakdown.cue).toBe(0.9);
    expect(fusion.breakdown.sae).toBe(0.8);
    expect(fusion.breakdown.sre).toBe(0.95);
  });

  it('should fallback to defaults when confidence values are missing/null', () => {
    const fusion = engine.fuse(null, null, null);
    
    // Defaults are cue=1.0, sae=0.5, sre=0.5
    // Calculation: (1.0 * 0.15) + (0.5 * 0.25) + (0.5 * 0.60)
    // = 0.15 + 0.125 + 0.30 = 0.575
    expect(fusion.fused).toBe(0.575);
  });
});
