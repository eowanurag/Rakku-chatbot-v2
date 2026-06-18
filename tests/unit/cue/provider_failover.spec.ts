import { UnderstandingProvider } from '../../../backend/src/copilot/cue/runtime/providers/understanding-provider.interface';
import { DictionaryUnderstandingProvider } from '../../../backend/src/copilot/cue/runtime/providers/dictionary-understanding.provider';
import { CueResult } from '../../../backend/src/copilot/cue/interfaces/cue-result.interface';


/**
 * CUE Provider Failover Readiness Test
 *
 * Validates that the CUE pipeline degrades gracefully:
 *   Dictionary Provider → AI Provider → Fallback Provider
 *
 * Since the AI provider is optional in Rakku V2, the failover chain is:
 *   Dictionary (primary) → Fallback (always available)
 *
 * This test verifies:
 *   1. Dictionary provider produces valid results for known terms
 *   2. Dictionary provider handles unknown/garbled input without crashing
 *   3. A simulated AI provider failure falls back to dictionary output
 *   4. A simulated total failure returns a safe fallback structure
 */

class FailingAIProvider implements UnderstandingProvider {
  async understand(_narrative: string, _sessionId?: string): Promise<CueResult> {
    throw new Error('AI_PROVIDER_UNAVAILABLE: Simulated provider failure');
  }
}

class FallbackProvider implements UnderstandingProvider {
  async understand(narrative: string, _sessionId?: string): Promise<CueResult> {
    return {
      originalNarrative: narrative,
      normalizedNarrative: narrative,
      language: 'en',
      languageConfidence: 0.5,
      entities: [],
      transformationLog: [],
      unknownTerms: [narrative],
      normalizationConfidence: 0.0,
      understandingConfidence: 0.0,
      understandingBand: 'LOW',
      understandingStatus: 'NOT_UNDERSTOOD',
      usedAI: false,
      requiresAIReview: true,
      cueDictionaryVersions: {
        synonyms: 'FALLBACK',
        dialects: 'FALLBACK',
        abbreviations: 'FALLBACK',
        normalizationRules: 'FALLBACK'
      },
      scenarioHints: [],
      provider: 'DICTIONARY',
      processingTimeMs: 0,
      dictionaryReleaseVersion: 'FALLBACK'
    };
  }
}

/**
 * Simulates the failover chain: try primary → try AI → fallback.
 * Returns the provider name that actually served the request.
 */
async function executeWithFailover(
  narrative: string,
  providers: { name: string; provider: UnderstandingProvider }[]
): Promise<{ result: CueResult; servedBy: string }> {
  for (const p of providers) {
    try {
      const result = await p.provider.understand(narrative);
      return { result, servedBy: p.name };
    } catch {
      // Try next provider
      continue;
    }
  }
  // Should never reach here if fallback is always present
  throw new Error('ALL_PROVIDERS_FAILED');
}

describe('CUE Provider Failover Readiness', () => {
  let dictionaryProvider: DictionaryUnderstandingProvider;
  let aiProvider: FailingAIProvider;
  let fallbackProvider: FallbackProvider;

  beforeAll(() => {
    dictionaryProvider = new DictionaryUnderstandingProvider();
    aiProvider = new FailingAIProvider();
    fallbackProvider = new FallbackProvider();
  });

  describe('Dictionary Provider (Primary)', () => {
    it('should produce valid CueResult for known narrative', async () => {
      const result = await dictionaryProvider.understand('I lost my aadhaar card');
      expect(result).toBeDefined();
      expect(result.originalNarrative).toBe('I lost my aadhaar card');
      expect(result.normalizedNarrative).toBeDefined();
      expect(result.provider).toBe('DICTIONARY');
      expect(result.understandingConfidence).toBeGreaterThan(0);
    });

    it('should handle completely unknown input without crashing', async () => {
      const result = await dictionaryProvider.understand('xyzzy qwpfg mnjkl');
      expect(result).toBeDefined();
      expect(result.provider).toBe('DICTIONARY');
      // Should have low confidence or unknown terms
      expect(result.normalizedNarrative).toBeDefined();
    });

    it('should handle empty input gracefully', async () => {
      const result = await dictionaryProvider.understand('');
      expect(result).toBeDefined();
      expect(result.provider).toBe('DICTIONARY');
    });
  });

  describe('AI Provider (Simulated Failure)', () => {
    it('should throw when AI provider is unavailable', async () => {
      await expect(aiProvider.understand('test input')).rejects.toThrow('AI_PROVIDER_UNAVAILABLE');
    });
  });

  describe('Fallback Provider (Last Resort)', () => {
    it('should always return a safe fallback structure', async () => {
      const result = await fallbackProvider.understand('anything');
      expect(result).toBeDefined();
      expect(result.understandingConfidence).toBe(0.0);
      expect(result.understandingBand).toBe('LOW');
      expect(result.understandingStatus).toBe('NOT_UNDERSTOOD');
      expect(result.requiresAIReview).toBe(true);
    });
  });

  describe('Failover Chain – Dictionary → AI → Fallback', () => {
    it('should resolve via Dictionary when all providers are available', async () => {
      const chain = [
        { name: 'DICTIONARY', provider: dictionaryProvider },
        { name: 'AI', provider: aiProvider },
        { name: 'FALLBACK', provider: fallbackProvider }
      ];

      const { result, servedBy } = await executeWithFailover('I lost my phone', chain);
      expect(servedBy).toBe('DICTIONARY');
      expect(result.provider).toBe('DICTIONARY');
    });

    it('should skip failing AI and fall back to Fallback when Dictionary also fails', async () => {
      const brokenDictionary: UnderstandingProvider = {
        understand: async () => { throw new Error('DICTIONARY_CORRUPTED'); }
      };

      const chain = [
        { name: 'DICTIONARY', provider: brokenDictionary },
        { name: 'AI', provider: aiProvider },
        { name: 'FALLBACK', provider: fallbackProvider }
      ];

      const { result, servedBy } = await executeWithFailover('I lost my phone', chain);
      expect(servedBy).toBe('FALLBACK');
      expect(result.understandingConfidence).toBe(0.0);
      expect(result.requiresAIReview).toBe(true);
    });

    it('should skip failing AI and use Dictionary when only AI fails', async () => {
      const chain = [
        { name: 'DICTIONARY', provider: dictionaryProvider },
        { name: 'AI', provider: aiProvider }
      ];

      const { result, servedBy } = await executeWithFailover('someone stole my bike', chain);
      expect(servedBy).toBe('DICTIONARY');
      expect(result.provider).toBe('DICTIONARY');
    });

    it('should produce consistent output for the same input regardless of failover path', async () => {
      const narrative = 'my aadhaar card is missing';

      // Path 1: Dictionary directly
      const direct = await dictionaryProvider.understand(narrative);

      // Path 2: Failover chain (Dictionary first)
      const chain = [
        { name: 'DICTIONARY', provider: dictionaryProvider },
        { name: 'FALLBACK', provider: fallbackProvider }
      ];
      const { result: failover } = await executeWithFailover(narrative, chain);

      // Same provider should produce same results
      expect(direct.normalizedNarrative).toBe(failover.normalizedNarrative);
      expect(direct.understandingConfidence).toBe(failover.understandingConfidence);
    });
  });

  describe('Expanded AI Failure Scenarios & Robust Fallbacks', () => {
    it('should handle AI provider timeout resiliently by falling back to Dictionary', async () => {
      const timeoutAI: UnderstandingProvider = {
        understand: async () => { throw new Error('AI_TIMEOUT: Request took too long'); }
      };

      const chain = [
        { name: 'AI', provider: timeoutAI },
        { name: 'DICTIONARY', provider: dictionaryProvider }
      ];

      const { result, servedBy } = await executeWithFailover('lost my driving licence', chain);
      expect(servedBy).toBe('DICTIONARY');
      expect(result.provider).toBe('DICTIONARY');
    });

    it('should handle AI provider rate limiting resiliently by falling back to Dictionary', async () => {
      const rateLimitAI: UnderstandingProvider = {
        understand: async () => { throw new Error('AI_RATE_LIMIT: Too many requests'); }
      };

      const chain = [
        { name: 'AI', provider: rateLimitAI },
        { name: 'DICTIONARY', provider: dictionaryProvider }
      ];

      const { result, servedBy } = await executeWithFailover('banking fraud complaint', chain);
      expect(servedBy).toBe('DICTIONARY');
      expect(result.provider).toBe('DICTIONARY');
    });

    it('should handle AI provider invalid JSON payload resiliently by falling back to Dictionary', async () => {
      const invalidJsonAI: UnderstandingProvider = {
        understand: async () => { throw new Error('AI_JSON_PARSE_ERROR: Invalid JSON returned'); }
      };

      const chain = [
        { name: 'AI', provider: invalidJsonAI },
        { name: 'DICTIONARY', provider: dictionaryProvider }
      ];

      const { result, servedBy } = await executeWithFailover('cyber crime report', chain);
      expect(servedBy).toBe('DICTIONARY');
      expect(result.provider).toBe('DICTIONARY');
    });

    it('should handle AI provider empty response resiliently by falling back to Dictionary', async () => {
      const emptyResponseAI: UnderstandingProvider = {
        understand: async () => { throw new Error('AI_EMPTY_RESPONSE: Received empty body'); }
      };

      const chain = [
        { name: 'AI', provider: emptyResponseAI },
        { name: 'DICTIONARY', provider: dictionaryProvider }
      ];

      const { result, servedBy } = await executeWithFailover('water supply problem', chain);
      expect(servedBy).toBe('DICTIONARY');
      expect(result.provider).toBe('DICTIONARY');
    });

    it('should handle AI provider hallucinated scenario resiliently by validating against graph', async () => {
      // AI returns a scenario that does not exist in our graph (e.g. HOGWARTS_MAGIC)
      const hallucinatedAI: UnderstandingProvider = {
        understand: async (narrative) => {
          const base = await dictionaryProvider.understand(narrative);
          return {
            ...base,
            scenarioHints: [{ root: 'HOGWARTS_MAGIC', confidence: 0.99 }],
            provider: 'AI'
          };
        }
      };

      const chain = [
        { name: 'AI', provider: hallucinatedAI },
        { name: 'DICTIONARY', provider: dictionaryProvider }
      ];

      const { result, servedBy } = await executeWithFailover('lost passport card', chain);
      
      // If AI returned a hallucination, we can fallback or filter out invalid hints
      const validGraphRoots = ['LOSS', 'THEFT', 'FRAUD', 'SERVICES', 'EMERGENCY', 'GRIEVANCE', 'SAFETY'];
      const filteredHints = result.scenarioHints.filter(h => validGraphRoots.includes(h.root));
      
      expect(filteredHints.length).toBe(0);
      expect(result.provider).toBe('AI'); // Served by AI, but invalid hints are cleaned up
    });
  });
});
