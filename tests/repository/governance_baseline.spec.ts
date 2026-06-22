import * as fs from 'fs';
import * as path from 'path';

describe('Governance Baseline Tests', () => {
  const file = path.resolve(__dirname, '../../storage/reports/governance-baseline.json');

  it('should verify frozen baseline values exist', () => {
    expect(fs.existsSync(file)).toBe(true);
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    expect(data.repositoryHealthScore).toBeDefined();
    expect(data.databaseHealthScore).toBeDefined();
    expect(data.technicalDebtScore).toBeDefined();
    expect(data.repositoryRiskScore).toBeDefined();
    expect(data.databaseOptimizationScore).toBeDefined();
  });
});
