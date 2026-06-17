import { DictionaryUnderstandingProvider } from '../../backend/src/copilot/cue/runtime/providers/dictionary-understanding.provider';

describe('CUE Provider Schema Contract', () => {
  it('should conform to the standard CueResult structure', async () => {
    const provider = new DictionaryUnderstandingProvider();
    const result = await provider.understand("हमार upi failed");

    expect(result.originalNarrative).toBe("हमार upi failed");
    expect(result.normalizedNarrative).toBe("मेरा upi payment failed");
    expect(result.provider).toBe("DICTIONARY");
    expect(result.cueDictionaryVersions).toBeDefined();
    expect(result.understandingStatus).toBeDefined();
    expect(result.understandingBand).toBeDefined();
  });
});
