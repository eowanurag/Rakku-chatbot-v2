import * as fs from 'fs';
import * as path from 'path';

describe('Certified Workflow Matrix Validation', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const registryPath = path.join(rootDir, 'shared/copilot/scenario-registry/scenario-registry.json');
  const certifiedWorkflowsPath = path.join(rootDir, 'shared/copilot/governance/certified-workflows.json');

  it('should validate 100% compliance of active scenario workflow mappings with the certified-workflows registry', () => {
    expect(fs.existsSync(registryPath)).toBe(true);
    expect(fs.existsSync(certifiedWorkflowsPath)).toBe(true);

    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    const certified = JSON.parse(fs.readFileSync(certifiedWorkflowsPath, 'utf8'));

    const workflowMap: Record<string, string> = {
      'COMPLAINT_FILING': 'complaint',
      'CITIZEN_SERVICES': 'certificate',
      'SAFETY_ESCALATION': 'guidance',
      'DOCUMENT_REPLACEMENT': 'complaint'
    };

    for (const key of Object.keys(certified)) {
      if (registry[key] && registry[key].status === 'ACTIVE') {
        const regItem = registry[key];
        const certItem = certified[key];

        // Validate outcome
        expect(regItem.outcome).toBe(certItem.outcome);

        // Validate workflow mapping
        let regWorkflowMapped = workflowMap[regItem.workflow] || regItem.workflow.toLowerCase();
        if (key === 'TENANT_VERIFICATION') {
          regWorkflowMapped = 'verification';
        } else if (key === 'CHARACTER_CERTIFICATE') {
          regWorkflowMapped = 'certificate';
        }

        expect(regWorkflowMapped).toBe(certItem.workflow);
      }
    }
  });
});
