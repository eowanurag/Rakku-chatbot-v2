import { DictionaryUnderstandingProvider } from '../../backend/src/copilot/cue/runtime/providers/dictionary-understanding.provider';

describe('CUE Performance Guardrails', () => {
  it('should satisfy performance thresholds', async () => {
    // 1. Measure load time
    const startLoad = Date.now();
    const provider = new DictionaryUnderstandingProvider();
    const endLoad = Date.now();
    const loadTime = endLoad - startLoad;
    
    expect(loadTime).toBeLessThan(2000); // < 2 seconds

    // 2. Measure memory footprint
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    expect(memoryUsage).toBeLessThan(250); // < 250 MB (accounts for Jest test runner baseline)

    // 3. Measure average normalization latency
    const narratives = [
      "hamar upi payment failed",
      "more mobile chute gawa",
      "I lost my dl license yesterday",
      "मेरा बटुआ चोरी हो गया",
      "aadhaar card link pending"
    ];

    const latencies: number[] = [];
    for (const text of narratives) {
      const start = Date.now();
      await provider.understand(text);
      const end = Date.now();
      latencies.push(end - start);
    }

    const averageLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    expect(averageLatency).toBeLessThan(100); // < 100 ms
  });
});
