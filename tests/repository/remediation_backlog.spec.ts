import * as fs from 'fs';
import * as path from 'path';

describe('Remediation Backlog Tests', () => {
  const file = path.resolve(__dirname, '../../storage/reports/remediation-backlog.json');

  it('should verify remediation backlog file format and tasks count', () => {
    expect(fs.existsSync(file)).toBe(true);
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    expect(Array.isArray(data)).toBe(true);
    for (const task of data) {
      expect(task.id).toBeDefined();
      expect(task.priority).toBeDefined();
      expect(['OPEN', 'IN_PROGRESS', 'DEFERRED', 'COMPLETED', 'ACCEPTED_RISK']).toContain(task.status);
    }
  });
});
