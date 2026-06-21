import * as fs from 'fs';
import * as path from 'path';

describe('Police Domain Boundary Validation', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const registryPath = path.join(rootDir, 'shared/copilot/scenario-registry/scenario-registry.json');

  it('should verify that non-police municipal/utility categories are not mapped to police criminal/emergency workflows', () => {
    expect(fs.existsSync(registryPath)).toBe(true);
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

    const municipalOrUtilityKeys = ['WATER_COMPLAINT', 'ELECTRICITY_COMPLAINT'];
    
    for (const key of municipalOrUtilityKeys) {
      if (registry[key]) {
        const item = registry[key];
        expect(item.workflow).not.toBe('SAFETY_ESCALATION');
        expect(item.workflow).not.toBe('COMPLAINT_FILING');
      } else {
        // Naturally rejected if not in registry
        expect(registry[key]).toBeUndefined();
      }
    }
  });
});
