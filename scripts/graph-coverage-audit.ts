import * as fs from 'fs';
import * as path from 'path';

export interface AuditReport {
  totalNodes: number;
  coveredNodes: number;
  coveragePercent: number;
  missingKnowledge: string[];
  missingPlaybooks: string[];
  missingOutcomes: string[];
  missingWorkflows: string[];
}

export function runGraphCoverageAudit(): AuditReport {
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

  const graphsPath = findSharedFile('scenario-graphs/graphs.json');
  const knowledgeDir = findSharedFile('knowledge');
  const playbooksDir = findSharedFile('playbooks');
  const riskRulesPath = findSharedFile('risk-rules/rules.json');
  const outcomeRulesPath = findSharedFile('outcome-rules/rules.json');
  const serviceMappingsPath = findSharedFile('service-mappings.json');

  const graphsData = JSON.parse(fs.readFileSync(graphsPath, 'utf8'));
  const activeNodes = Object.entries<any>(graphsData.nodes || {}).filter(
    ([, node]) => node.status === 'ACTIVE'
  ).map(([name]) => name);

  const riskRules = fs.existsSync(riskRulesPath) ? JSON.parse(fs.readFileSync(riskRulesPath, 'utf8')) : { scenarios: {} };
  const outcomeRules = fs.existsSync(outcomeRulesPath) ? JSON.parse(fs.readFileSync(outcomeRulesPath, 'utf8')) : { mappings: {} };
  const serviceMappings = fs.existsSync(serviceMappingsPath) ? JSON.parse(fs.readFileSync(serviceMappingsPath, 'utf8')) : { mappings: {} };

  const report: AuditReport = {
    totalNodes: activeNodes.length,
    coveredNodes: 0,
    coveragePercent: 0,
    missingKnowledge: [],
    missingPlaybooks: [],
    missingOutcomes: [],
    missingWorkflows: []
  };

  for (const node of activeNodes) {
    const nodeLower = node.toLowerCase();
    const nodeUpper = node.toUpperCase();

    // Check Knowledge File
    const kPath = path.join(knowledgeDir, `${nodeLower}.json`);
    const hasKnowledge = fs.existsSync(kPath);
    if (!hasKnowledge) {
      report.missingKnowledge.push(nodeUpper);
    }

    // Check Playbook
    const pPathYaml = path.join(playbooksDir, `${nodeUpper}.yaml`);
    const pPathYml = path.join(playbooksDir, `${nodeUpper}.yml`);
    const hasPlaybook = fs.existsSync(pPathYaml) || fs.existsSync(pPathYml);
    if (!hasPlaybook) {
      report.missingPlaybooks.push(nodeUpper);
    }

    // Check Risk Rule
    const hasRiskRule = !!(riskRules.scenarios && riskRules.scenarios[nodeUpper]);

    // Check Outcome Rule
    const hasOutcomeRule = !!(outcomeRules.mappings && outcomeRules.mappings[nodeUpper]);
    if (!hasOutcomeRule) {
      report.missingOutcomes.push(nodeUpper);
    }

    // Check Workflow Mapping
    // Node maps to outcomes in outcome rules. Check if those outcomes, or the node itself, map to a workflowId in service-mappings
    let mapsToWorkflow = false;
    if (serviceMappings.mappings && serviceMappings.mappings[nodeUpper]) {
      mapsToWorkflow = true;
    } else if (hasOutcomeRule) {
      const outcomes = outcomeRules.mappings[nodeUpper].outcomes || [];
      for (const outcome of outcomes) {
        if (serviceMappings.mappings && serviceMappings.mappings[outcome]) {
          mapsToWorkflow = true;
          break;
        }
      }
    }

    if (!mapsToWorkflow) {
      report.missingWorkflows.push(nodeUpper);
    }

    // A node is considered "covered" if it has all resources successfully mapped
    if (hasKnowledge && hasPlaybook && hasRiskRule && hasOutcomeRule && mapsToWorkflow) {
      report.coveredNodes++;
    }
  }

  report.coveragePercent = report.totalNodes > 0 ? (report.coveredNodes / report.totalNodes) * 100 : 0;

  return report;
}

if (require.main === module) {
  const result = runGraphCoverageAudit();
  console.log(JSON.stringify(result, null, 2));
}
