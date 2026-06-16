import { AiClassifier } from '../../backend/src/situation-assessment/classification/ai-classifier';
import axios from 'axios';

jest.mock('axios');

describe('Gemini AI Fallback and Resilience Spec', () => {
  let aiClassifier: AiClassifier;
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(() => {
    jest.clearAllMocks();
    aiClassifier = new AiClassifier();
    // Enable API Key for test mock context
    (aiClassifier as any).apiKey = "test-api-key";
  });

  it('should fallback gracefully on 401 Unauthorized API error', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 401, data: "Unauthorized" }
    });

    const result = await aiClassifier.classify("Help my phone was stolen.");
    
    expect(result).toBeDefined();
    expect(result.intent).toBe("UNKNOWN");
    expect(result.requiresClarification).toBe(true);
    expect(result.reasoning[0]).toContain("Could not verify narrative context");
  });

  it('should fallback gracefully on 429 Rate Limited API error', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 429, data: "Rate limit exceeded" }
    });

    const result = await aiClassifier.classify("Help my phone was stolen.");
    
    expect(result).toBeDefined();
    expect(result.intent).toBe("UNKNOWN");
    expect(result.requiresClarification).toBe(true);
  });

  it('should fallback gracefully on 503 Service Unavailable error', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 503, data: "Service Unavailable" }
    });

    const result = await aiClassifier.classify("Help my phone was stolen.");
    
    expect(result).toBeDefined();
    expect(result.intent).toBe("UNKNOWN");
    expect(result.requiresClarification).toBe(true);
  });

  it('should fallback gracefully on API request timeout', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error("timeout of 10000ms exceeded"));

    const result = await aiClassifier.classify("Help my phone was stolen.");
    
    expect(result).toBeDefined();
    expect(result.intent).toBe("UNKNOWN");
    expect(result.requiresClarification).toBe(true);
  });
});
