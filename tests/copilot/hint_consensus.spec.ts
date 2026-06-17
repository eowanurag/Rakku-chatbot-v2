import { HintConsensusEngine } from '../../backend/src/copilot/sae/consensus/hint-consensus.engine';

describe('HintConsensusEngine Validation', () => {
  it('should resolve conflicts and identify consensus hints deterministically', () => {
    const engine = new HintConsensusEngine();
    
    const results = [
      { confidence: 0.95, scenarioHints: ["LOSS", "DOCUMENT"], hintSource: ["RULE_CLASSIFIER"], entities: [] },
      { confidence: 0.90, scenarioHints: ["LOSS", "DOCUMENT", "AADHAAR"], hintSource: ["PATTERN_CLASSIFIER"], entities: [] },
      { confidence: 0.85, scenarioHints: ["THEFT", "DOCUMENT", "AADHAAR"], hintSource: ["AI_CLASSIFIER"], entities: [] }
    ];

    const consensus = engine.resolveConsensus(results);

    expect(consensus.acceptedHints).toContain("LOSS");
    expect(consensus.acceptedHints).toContain("DOCUMENT");
    expect(consensus.acceptedHints).toContain("AADHAAR");
    expect(consensus.rejectedHints).toContain("THEFT"); // Only 1 out of 3 votes
    expect(consensus.consensusScore).toBe(0.75); // 3 accepted, 1 rejected -> 3/4 = 0.75
    expect(consensus.sources["DOCUMENT"]).toContain("RULE_CLASSIFIER");
    expect(consensus.sources["DOCUMENT"]).toContain("PATTERN_CLASSIFIER");
    expect(consensus.sources["DOCUMENT"]).toContain("AI_CLASSIFIER");
  });
});
