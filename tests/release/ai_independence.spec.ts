import * as fs from 'fs';
import * as path from 'path';
import { FactExtractor } from '../../backend/src/copilot/cie/engines/fact-extractor';
import { AiClassifier } from '../../backend/src/copilot/sae/classification/ai-classifier';
import { AiHealthStatus } from '../../backend/src/copilot/ai-monitoring/ai-health.types';

describe('AI Independence Integration Spec', () => {
  let dataset: any[];
  let factExtractor: FactExtractor;
  let aiClassifier: AiClassifier;
  const originalApiKey = process.env.GEMINI_API_KEY;
  const originalDisabled = process.env.AI_DISABLED;

  beforeAll(() => {
    // Unset Gemini Credentials
    process.env.GEMINI_API_KEY = '';
    process.env.AI_DISABLED = 'true';

    const datasetPath = path.join(__dirname, 'datasets/ai_independence_dataset.json');
    dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

    factExtractor = new FactExtractor();
    aiClassifier = new AiClassifier();
  });

  afterAll(() => {
    process.env.GEMINI_API_KEY = originalApiKey;
    process.env.AI_DISABLED = originalDisabled;
  });

  it('should verify dataset is loaded and has 19 journeys', () => {
    expect(dataset).toBeDefined();
    expect(dataset.length).toBe(19);
  });

  it('should execute every dataset journey without throwing exceptions', async () => {
    for (const journey of dataset) {
      // 1. Fact Extraction check
      const extractResult = await factExtractor.extract(journey.query, journey.scenario);
      expect(extractResult).toBeDefined();
      expect(extractResult.facts).toBeDefined();
      expect(extractResult.model).toBeDefined();

      // 2. Intent Classifier check
      const classifyResult = await aiClassifier.classify(journey.query);
      expect(classifyResult).toBeDefined();
      expect(classifyResult.success).toBe(false); // Since AI is disabled
      expect(classifyResult.fallbackUsed).toBe(true);
      expect(classifyResult.data).toBeDefined();
      expect(classifyResult.data.intent).toBe('UNKNOWN');
    }
  });

  it('should enforce deterministic precedence rule: Regex > Rule > AI', async () => {
    // Query with both plate (regex) and generic stolen phone (rules)
    const complexQuery = 'UP32AB1234 was stolen along with my iPhone';
    const result = await factExtractor.extract(complexQuery, 'THEFT');

    expect(result.facts).toBeDefined();

    // Check vehicle plate regex extraction
    const vehicleFact = result.facts.find(f => f.field === 'vehicle_plate');
    expect(vehicleFact).toBeDefined();
    expect(vehicleFact?.value).toBe('UP32AB1234');

    // Check rules extraction
    const brandFact = result.facts.find(f => f.field === 'property_brand');
    expect(brandFact).toBeDefined();
    expect(brandFact?.value).toBe('Iphone');
  });

  it('should return AiHealthStatus.UNAVAILABLE when AI is disabled', async () => {
    const health = await aiClassifier.healthCheck();
    expect(health).toBe(AiHealthStatus.UNAVAILABLE);
  });
});
