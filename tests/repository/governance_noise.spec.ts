import * as fs from 'fs';
import * as path from 'path';

describe('Governance Noise Tests', () => {
  const file = path.resolve(__dirname, '../../storage/reports/governance-noise-report.json');

  it('should verify noise ratio calculation schema is valid', () => {
    expect(fs.existsSync(file)).toBe(true);
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    expect(data.noiseRatio).toBeDefined();
    expect(data.totalRecommendations).toBeGreaterThanOrEqual(0);
    expect(data.duplicateRecommendations).toBeGreaterThanOrEqual(0);
    expect(data.staleRecommendations).toBeGreaterThanOrEqual(0);
  });
});
