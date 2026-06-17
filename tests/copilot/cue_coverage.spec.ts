import { DictionaryUnderstandingProvider } from '../../backend/src/copilot/cue/runtime/providers/dictionary-understanding.provider';

describe('CUE Coverage & Quality Metrics', () => {
  it('should meet the coverage and normalization success thresholds', async () => {
    const provider = new DictionaryUnderstandingProvider();

    // 10 test statements representing target vocabulary and slang
    const corpus = [
      "मोर मोबाइल छूट गवा",
      "hamar upi payment failed",
      "my dl and aadhaar were lost",
      "मेरा परस खो गया",
      "i lost my cellphone mobile yesterday",
      "hamar pocket stole gawa",
      "character certificate status pending",
      "online scam cyber theft help",
      "wallet and cash lost near station",
      "tenant verification link issue"
    ];

    let understoodCount = 0;
    let successCount = 0;

    for (const text of corpus) {
      const res = await provider.understand(text);
      if (res.understandingStatus === 'UNDERSTOOD' || res.understandingStatus === 'PARTIALLY_UNDERSTOOD') {
        understoodCount++;
      }
      // Success means confidence in normalization matches rule definitions
      if (res.normalizationConfidence >= 0.85) {
        successCount++;
      }
    }

    const coverage = (understoodCount / corpus.length) * 100;
    const normalizationSuccessRate = (successCount / corpus.length) * 100;

    console.log(`[CUE Analytics] coverage=${coverage}% normalizationSuccessRate=${normalizationSuccessRate}%`);

    // Verify build thresholds
    expect(coverage).toBeGreaterThanOrEqual(80); // Coverage >= 80%
    expect(normalizationSuccessRate).toBeGreaterThanOrEqual(90); // Normalization Success >= 90%
  });
});
