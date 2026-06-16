import * as fs from 'fs';
import * as path from 'path';

describe('Intent Dictionary Integrity Spec', () => {
  const intentsPath = path.resolve(__dirname, '../../shared/copilot/intents.json');

  it('should verify that intents.json dictionary exists and has version and lastUpdated fields', () => {
    expect(fs.existsSync(intentsPath)).toBe(true);
    
    const fileContent = fs.readFileSync(intentsPath, 'utf8');
    const data = JSON.parse(fileContent);

    expect(data.version).toBeDefined();
    expect(typeof data.version).toBe('string');
    expect(data.lastUpdated).toBeDefined();
  });

  it('should verify every intent has category, recommendedService, and defaultConfidence defined', () => {
    const fileContent = fs.readFileSync(intentsPath, 'utf8');
    const data = JSON.parse(fileContent);
    const intentsObj = data.intents;

    expect(intentsObj).toBeDefined();
    expect(typeof intentsObj).toBe('object');

    const intentKeys = Object.keys(intentsObj);
    expect(intentKeys.length).toBeGreaterThan(0);

    intentKeys.forEach(intentKey => {
      const metadata = intentsObj[intentKey];
      
      expect(metadata.category).toBeDefined();
      expect(typeof metadata.category).toBe('string');

      expect(metadata.recommendedService).toBeDefined();
      expect(typeof metadata.recommendedService).toBe('string');

      expect(metadata.defaultConfidence).toBeDefined();
      expect(typeof metadata.defaultConfidence).toBe('number');
      expect(metadata.defaultConfidence).toBeGreaterThan(0.0);
      expect(metadata.defaultConfidence).toBeLessThanOrEqual(1.0);
    });
  });
});
