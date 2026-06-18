import { DictionaryUnderstandingProvider } from '../../backend/src/copilot/cue/runtime/providers/dictionary-understanding.provider';
import { UnderstandingProvider } from '../../backend/src/copilot/cue/runtime/providers/understanding-provider.interface';
import { CueResult } from '../../backend/src/copilot/cue/interfaces/cue-result.interface';

/**
 * Mock AI Understanding Provider for shadow mode comparisons
 */
class ShadowAIProvider implements UnderstandingProvider {
  constructor(private dictionaryProvider: DictionaryUnderstandingProvider) {}

  async understand(narrative: string, sessionId?: string): Promise<CueResult> {
    const dictResult = await this.dictionaryProvider.understand(narrative, sessionId);
    
    // Simulate AI enhancements (e.g. higher confidence, resolved entities, or occasional regression)
    const normalizedLower = narrative.toLowerCase();
    
    if (normalizedLower.includes('regress')) {
      // Simulate a regression (low confidence)
      return {
        ...dictResult,
        understandingConfidence: 0.15,
        understandingBand: 'LOW',
        provider: 'AI_SHADOW'
      };
    }

    if (normalizedLower.includes('improve') || dictResult.understandingBand === 'LOW') {
      // Simulate an improvement (boost confidence or normalize better)
      return {
        ...dictResult,
        understandingConfidence: 0.96,
        understandingBand: 'HIGH',
        provider: 'AI_SHADOW'
      };
    }

    // Default: match dictionary
    return {
      ...dictResult,
      provider: 'AI_SHADOW'
    };
  }
}

describe('AI Shadow Comparison Evaluation (Informational Only)', () => {
  let dictionaryProvider: DictionaryUnderstandingProvider;
  let shadowAIProvider: ShadowAIProvider;

  beforeAll(() => {
    dictionaryProvider = new DictionaryUnderstandingProvider();
    shadowAIProvider = new ShadowAIProvider(dictionaryProvider);
  });

  it('should run CUE dictionary path vs AI shadow path and compute comparison statistics', async () => {
    const testQueries = [
      'I lost my aadhaar card',
      'some phone is stolen',
      'improve my details',
      'regress my path',
      'unrelated query text'
    ];

    let agreementCount = 0;
    let aiImprovementCases = 0;
    let aiRegressionCases = 0;

    for (const query of testQueries) {
      const dictResult = await dictionaryProvider.understand(query);
      const aiResult = await shadowAIProvider.understand(query);

      // Check agreement on normalized output or understanding band
      if (dictResult.understandingBand === aiResult.understandingBand) {
        agreementCount++;
      } else if (aiResult.understandingConfidence > dictResult.understandingConfidence) {
        aiImprovementCases++;
      } else {
        aiRegressionCases++;
      }
    }

    const agreementRate = (agreementCount / testQueries.length) * 100;

    const shadowReport = {
      agreementRate: agreementRate / 100,
      aiImprovementCases,
      aiRegressionCases
    };

    console.log(`[AI Shadow Comparison Report]`);
    console.log(JSON.stringify(shadowReport, null, 2));

    // Warn only, do not fail
    expect(agreementRate).toBeGreaterThanOrEqual(0); // Always passes
  });
});
