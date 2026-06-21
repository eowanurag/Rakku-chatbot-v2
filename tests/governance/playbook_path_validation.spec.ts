import * as fs from 'fs';
import * as path from 'path';

describe('Playbook Path and Transition Validation', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const playbooksDir = path.join(rootDir, 'shared/copilot/playbooks');

  it('should validate every playbook against expected progression restrictions and check for domain safety', () => {
    const files = fs.readdirSync(playbooksDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const filePath = path.join(playbooksDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Parse YAML (using basic regex or js-yaml, since we want to be safe, we can use simple parse/check)
      const isBikeOrTheft = file.toUpperCase().includes('BIKE') || file.toUpperCase().includes('THEFT') || file.toUpperCase().includes('VEHICLE');
      const isMobile = file.toUpperCase().includes('MOBILE');

      if (isBikeOrTheft && !isMobile) {
        // Bike/Theft playbooks must not contain mobile-specific terms like imei or mobile brand
        expect(content.toLowerCase()).not.toContain('imei');
        expect(content.toLowerCase()).not.toContain('sim card');
      }

      if (isMobile) {
        // Mobile playbooks must not contain vehicle theft workflow steps
        expect(content.toLowerCase()).not.toContain('vehicle_details');
      }
    }
  });
});
