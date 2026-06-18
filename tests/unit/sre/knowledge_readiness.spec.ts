import * as fs from 'fs';
import * as path from 'path';

/**
 * Knowledge Layer Readiness Audit
 *
 * Validates:
 *   - Every knowledge file contains all required fields:
 *     1. Scenario description
 *     2. Citizen risks
 *     3. Required information
 *     4. Recommended actions
 *     5. Escalation guidance
 */
describe('SRE Knowledge Layer Readiness', () => {
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

  it('should validate all knowledge files contain required information', () => {
    const graphsPath = findSharedFile('scenario-graphs/graphs.json');
    const knowledgeDir = findSharedFile('knowledge');

    const graphsData = JSON.parse(fs.readFileSync(graphsPath, 'utf8'));
    const activeNodes = Object.entries<any>(graphsData.nodes || {}).filter(
      ([, node]) => node.status === 'ACTIVE'
    ).map(([name]) => name);

    let foundKnowledgeCount = 0;
    let completeKnowledgeCount = 0;

    for (const node of activeNodes) {
      const kPath = path.join(knowledgeDir, `${node.toLowerCase()}.json`);
      if (fs.existsSync(kPath)) {
        foundKnowledgeCount++;
        const content = JSON.parse(fs.readFileSync(kPath, 'utf8'));

        const hasDescription = !!(content.description || content.scenario);
        const hasRisks = !!(content.citizenRisks || content.defaultRisk);
        const hasRequiredInfo = Array.isArray(content.requiredInformation);
        const hasActions = Array.isArray(content.recommendedActions);
        const hasEscalation = !!(content.escalationGuidance || content.citizenGuidance);

        if (hasDescription && hasRisks && hasRequiredInfo && hasActions && hasEscalation) {
          completeKnowledgeCount++;
        }
      }
    }

    const knowledgeCoverage = activeNodes.length > 0 ? (foundKnowledgeCount / activeNodes.length) * 100 : 0;
    const knowledgeCompleteness = foundKnowledgeCount > 0 ? (completeKnowledgeCount / foundKnowledgeCount) * 100 : 0;

    const report = {
      knowledgeCoverage,
      knowledgeCompleteness
    };

    console.log(`[Knowledge Readiness Audit]`);
    console.log(JSON.stringify(report, null, 2));

    expect(knowledgeCoverage).toBeGreaterThanOrEqual(95);
    expect(knowledgeCompleteness).toBe(100);
  });
});
