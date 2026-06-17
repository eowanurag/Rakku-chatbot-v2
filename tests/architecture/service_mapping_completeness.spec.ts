import { WorkflowRegistryService } from '../../backend/src/orchestration/workflow-registry.service';
import { WorkflowRegistryValidator } from '../../backend/src/orchestration/workflow-registry.validator';
import * as fs from 'fs';
import * as path from 'path';

describe('Service Mapping Completeness and Integrity', () => {
  it('should successfully validate that all intents are mapped to valid workflows without throwing', () => {
    const registry = new WorkflowRegistryService();
    // Manually trigger init
    registry.onModuleInit();

    const validator = new WorkflowRegistryValidator(registry);
    
    // This will throw an error if any intent maps to an invalid workflow or is missing a mapping
    expect(() => validator.validate()).not.toThrow();
  });

  it('should check service-mappings.json metadata attributes', () => {
    const findSharedFile = (filename: string): string => {
      let p = path.resolve(process.cwd(), 'shared/copilot', filename);
      if (fs.existsSync(p)) return p;
      p = path.resolve(process.cwd(), '../shared/copilot', filename);
      if (fs.existsSync(p)) return p;
      for (let i = 1; i <= 5; i++) {
        const dots = '../'.repeat(i);
        p = path.resolve(__dirname, dots, 'shared/copilot', filename);
        if (fs.existsSync(p)) return p;
      }
      return path.resolve(__dirname, filename);
    };

    const mappingsPath = findSharedFile('service-mappings.json');
    const rawData = fs.readFileSync(mappingsPath, 'utf8');
    const data = JSON.parse(rawData);

    expect(data.version).toBeDefined();
    expect(data.lastUpdated).toBeDefined();
    expect(data.mappings).toBeDefined();

    // Verify all mapping entries have required attributes
    Object.entries<any>(data.mappings).forEach(([serviceKey, mapping]) => {
      expect(mapping.workflowId).toBeDefined();
      expect(typeof mapping.workflowId).toBe('string');
      expect(mapping.displayName).toBeDefined();
      expect(typeof mapping.displayName).toBe('string');
      expect(mapping.requiresPrerequisites).toBeDefined();
      expect(typeof mapping.requiresPrerequisites).toBe('boolean');
    });
  });
});
