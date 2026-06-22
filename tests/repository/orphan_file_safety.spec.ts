import * as fs from 'fs';
import * as path from 'path';

describe('Orphan File Safety Certification Tests', () => {
  let cert: any;

  beforeAll(() => {
    const certPath = path.resolve(__dirname, '../../storage/reports/orphan-file-certification.json');
    if (fs.existsSync(certPath)) {
      cert = JSON.parse(fs.readFileSync(certPath, 'utf8'));
    }
  });

  it('should verify orphan certification structure exists', () => {
    expect(cert).toBeDefined();
    expect(cert.safeToDelete).toBeInstanceOf(Array);
    expect(cert.manualReview).toBeInstanceOf(Array);
  });

  it('should verify critical folders/files are never auto-marked as SafeToDelete', () => {
    const safeList: string[] = cert.safeToDelete || [];

    for (const file of safeList) {
      const lower = file.toLowerCase();
      // Safety checks: can never be in scripts, migrations, test fixtures, dynamic imports, reflection files
      expect(lower.includes('scripts/')).toBe(false);
      expect(lower.includes('migrations/')).toBe(false);
      expect(lower.includes('fixture')).toBe(false);
      expect(lower.includes('cron')).toBe(false);
      expect(lower.includes('dynamic')).toBe(false);
      expect(lower.includes('reflection')).toBe(false);
      expect(lower.includes('.snap')).toBe(false);
      expect(lower.endsWith('.json')).toBe(false);
      expect(lower.endsWith('.d.ts')).toBe(false);
    }
  });
});
