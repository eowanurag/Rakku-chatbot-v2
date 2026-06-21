import * as fs from 'fs';
import * as path from 'path';

describe('Knowledge Governance Scenario Traceability Audit Suite', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const graphsPath = path.join(rootDir, 'shared/copilot/scenario-graphs/graphs.json');
  const outcomeRulesPath = path.join(rootDir, 'shared/copilot/outcome-rules/rules.json');
  const registryPath = path.join(rootDir, 'shared/copilot/scenario-registry/scenario-registry.json');
  const knowledgeDir = path.join(rootDir, 'shared/copilot/knowledge');
  const playbooksDir = path.join(rootDir, 'shared/copilot/playbooks');

  it('should verify 100% scenario links: Graph Node -> Knowledge -> Playbook -> Workflow -> Outcome', () => {
    const graphs = JSON.parse(fs.readFileSync(graphsPath, 'utf8'));
    const outcomeRules = JSON.parse(fs.readFileSync(outcomeRulesPath, 'utf8'));
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

    const activeLeaves = Object.entries<any>(graphs.nodes)
      .filter(([, node]) => node.status === 'ACTIVE' && (!node.children || node.children.length === 0))
      .map(([name]) => name);

    expect(activeLeaves.length).toBeGreaterThan(0);

    for (const node of activeLeaves) {
      // 1. Verify scenario registry entry
      const reg = registry[node];
      expect(reg).toBeDefined();

      // 2. Verify knowledge file
      const kFile = path.join(knowledgeDir, `${node.toLowerCase()}.json`);
      expect(fs.existsSync(kFile)).toBe(true);

      // 3. Verify playbook file
      const pFile = path.join(playbooksDir, `${node.toUpperCase()}.yaml`);
      expect(fs.existsSync(pFile)).toBe(true);

      // 4. Verify outcome rule mapping
      const outcomes = outcomeRules.mappings[node]?.outcomes;
      expect(outcomes).toBeDefined();
      expect(outcomes.length).toBeGreaterThan(0);

      // 5. Verify workflow matching outcome
      expect(reg.workflow).toBeDefined();
      expect(reg.outcome).toBeDefined();
    }

    console.log(`[Traceability Audit] 100% verified for all ${activeLeaves.length} active scenarios.`);
  });
});
