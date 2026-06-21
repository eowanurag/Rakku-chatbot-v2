import * as fs from 'fs';
import * as path from 'path';

describe('Scenario Workflow Coverage Validation', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const graphsPath = path.join(rootDir, 'shared/copilot/scenario-graphs/graphs.json');
  const outcomeRulesPath = path.join(rootDir, 'shared/copilot/outcome-rules/rules.json');
  const registryPath = path.join(rootDir, 'shared/copilot/scenario-registry/scenario-registry.json');
  const knowledgeDir = path.join(rootDir, 'shared/copilot/knowledge');
  const playbooksDir = path.join(rootDir, 'shared/copilot/playbooks');

  it('should ensure 100% scenario workflow coverage across all active nodes', () => {
    const graphs = JSON.parse(fs.readFileSync(graphsPath, 'utf8'));
    const outcomeRules = JSON.parse(fs.readFileSync(outcomeRulesPath, 'utf8'));
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

    const activeLeaves = Object.entries<any>(graphs.nodes)
      .filter(([, node]) => node.status === 'ACTIVE' && (!node.children || node.children.length === 0))
      .map(([name]) => name);

    expect(activeLeaves.length).toBeGreaterThan(0);

    for (const node of activeLeaves) {
      // Registry Link
      expect(registry[node]).toBeDefined();
      expect(registry[node].status).toBe('ACTIVE');

      // Knowledge file link
      const kFile = path.join(knowledgeDir, `${node.toLowerCase()}.json`);
      expect(fs.existsSync(kFile)).toBe(true);

      // Playbook link
      const pFile = path.join(playbooksDir, `${node.toUpperCase()}.yaml`);
      expect(fs.existsSync(pFile)).toBe(true);

      // Outcome link
      const outcomes = outcomeRules.mappings[node]?.outcomes;
      expect(outcomes).toBeDefined();
      expect(outcomes.length).toBeGreaterThan(0);
    }
  });
});
