import { DictionaryUnderstandingProvider } from '../../backend/src/copilot/cue/runtime/providers/dictionary-understanding.provider';

describe('CUE Core Translation & Resolution', () => {
  let provider: DictionaryUnderstandingProvider;

  beforeAll(() => {
    provider = new DictionaryUnderstandingProvider();
  });

  it('should normalize dialect inputs and output transformation logs', async () => {
    const result = await provider.understand("मोर मोबाइल छूट गवा");
    
    expect(result.originalNarrative).toBe("मोर मोबाइल छूट गवा");
    expect(result.normalizedNarrative).toBe("मेरा MOBILE खो गया");
    
    // Check transformation logs
    const logs = result.transformationLog;
    expect(logs.some(l => l.from === "मोर" && l.to === "मेरा" && l.source === "DIALECT")).toBe(true);
    expect(logs.some(l => l.from === "छूट गवा" && l.to === "खो गया" && l.source === "DIALECT")).toBe(true);
    expect(logs.some(l => l.from === "मोबाइल" && l.to === "MOBILE" && l.source === "SYNONYM")).toBe(true);
  });

  it('should map abbreviations and calculate correct confidences', async () => {
    const result = await provider.understand("dl and aadhaar lost");
    
    expect(result.normalizedNarrative).toBe("driving licence and aadhaar card lost");
    expect(result.understandingStatus).toBe("UNDERSTOOD");
    expect(result.requiresAIReview).toBe(false);
  });

  it('should flag AI review when unknown terms exist', async () => {
    const result = await provider.understand("मेरा laptop खो गया");
    
    expect(result.unknownTerms).toContain("laptop");
    expect(result.requiresAIReview).toBe(true);
  });

  it('should output structured scenario hints compatible with SRE', async () => {
    const result = await provider.understand("lost my mobile");
    
    expect(result.scenarioHints).toBeDefined();
    expect(result.scenarioHints?.length).toBeGreaterThanOrEqual(1);
    expect(result.scenarioHints?.[0].root).toBe("LOSS");
    expect(result.scenarioHints?.[0].branch).toBe("DOCUMENT");
    expect(result.scenarioHints?.[0].leaf).toBe("MOBILE");
  });
});
