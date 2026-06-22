import * as fs from 'fs';
import * as path from 'path';

describe('Performance Benchmark', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });
  it('should generate a performance report file with expected properties', () => {
    const reportPath = path.resolve(__dirname, '../../storage/reports/database-performance-report.json');
    
    // Check if the file exists
    const exists = fs.existsSync(reportPath);
    expect(exists).toBe(true);
    
    if (exists) {
      // Parse and validate report structure
      const content = fs.readFileSync(reportPath, 'utf8');
      const report = JSON.parse(content);
      
      expect(report).toHaveProperty('avgCitizenLookupMs');
      expect(report).toHaveProperty('avgWorkflowResumeMs');
      expect(report).toHaveProperty('avgComplaintLookupMs');
      expect(report).toHaveProperty('slowQueries');
      expect(report).toHaveProperty('executedAt');
      expect(Array.isArray(report.slowQueries)).toBe(true);
    }
  });
});
