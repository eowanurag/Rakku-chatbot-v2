import * as fs from 'fs';
import * as path from 'path';

describe('Database Health Report', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });
  it('should generate a health report file', () => {
    const reportPath = path.resolve(__dirname, '../../storage/reports/database-health-report.json');
    
    // Check if the file exists
    const exists = fs.existsSync(reportPath);
    expect(exists).toBe(true);
    
    if (exists) {
      // Parse and validate report structure
      const content = fs.readFileSync(reportPath, 'utf8');
      const report = JSON.parse(content);
      
      expect(report).toHaveProperty('totalRecords');
      expect(report).toHaveProperty('duplicateMobiles');
      expect(report).toHaveProperty('orphanSessions');
      expect(report).toHaveProperty('orphanComplaints');
      expect(report).toHaveProperty('missingIndexes');
      expect(report).toHaveProperty('uniqueConstraintsHealthy');
      expect(report).toHaveProperty('databaseOptimized');
    }
  });
});
