import * as fs from 'fs';
import * as path from 'path';

describe('Database Optimization', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });
  it('should be marked as optimized in health report', () => {
    const reportPath = path.resolve(__dirname, '../../storage/reports/database-health-report.json');
    
    const exists = fs.existsSync(reportPath);
    expect(exists).toBe(true);
    
    if (exists) {
      const content = fs.readFileSync(reportPath, 'utf8');
      const report = JSON.parse(content);
      
      expect(report.databaseOptimized).toBe(true);
    }
  });
});
