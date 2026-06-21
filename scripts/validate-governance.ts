import * as fs from 'fs';
import * as path from 'path';
import * as jsyaml from 'js-yaml';

const rootDir = path.resolve(__dirname, '../');
const graphsPath = path.join(rootDir, 'shared/copilot/scenario-graphs/graphs.json');
const outcomeRulesPath = path.join(rootDir, 'shared/copilot/outcome-rules/rules.json');
const registryPath = path.join(rootDir, 'shared/copilot/scenario-registry/scenario-registry.json');
const knowledgeDir = path.join(rootDir, 'shared/copilot/knowledge');
const playbooksDir = path.join(rootDir, 'shared/copilot/playbooks');

export function validateGovernance(): { success: boolean; errors: string[]; stats: any } {
  const errors: string[] = [];
  let orphanCount = 0;
  let overdueCount = 0;

  const graphs = JSON.parse(fs.readFileSync(graphsPath, 'utf8'));
  const outcomeRules = JSON.parse(fs.readFileSync(outcomeRulesPath, 'utf8'));
  const registry = fs.existsSync(registryPath) ? JSON.parse(fs.readFileSync(registryPath, 'utf8')) : {};

  const activeNodes = Object.entries(graphs.nodes).filter(
    ([, node]: [string, any]) => node.status === 'ACTIVE'
  );

  const activeLeaves = activeNodes.filter(
    ([, node]: [string, any]) => !node.children || node.children.length === 0
  );

  console.log(`Auditing ${activeLeaves.length} active leaf scenarios...`);

  const requiredFields = [
    'description',
    'eligibility',
    'requiredInformation',
    'requiredDocuments',
    'risks',
    'escalationRules',
    'recommendedActions',
    'officerGuidance',
    'citizenGuidance',
    'references'
  ];

  for (const [key] of activeLeaves) {
    let hasOrphanProperty = false;

    // 1. Check Scenario Registry
    const regEntry = registry[key];
    if (!regEntry) {
      errors.push(`Orphan Node: Active leaf "${key}" is missing from scenario-registry.json`);
      orphanCount++;
      hasOrphanProperty = true;
    }

    // 2. Check Outcome Rules
    const outcomes = outcomeRules.mappings[key]?.outcomes;
    if (!outcomes || outcomes.length === 0) {
      errors.push(`Orphan Node: Active leaf "${key}" is missing outcome mappings in rules.json`);
      orphanCount++;
      hasOrphanProperty = true;
    }

    // 3. Check Knowledge File
    const kFile = `${key.toLowerCase()}.json`;
    const kPath = path.join(knowledgeDir, kFile);
    if (!fs.existsSync(kPath)) {
      errors.push(`Orphan Node: Active leaf "${key}" is missing knowledge JSON file "${kFile}"`);
      orphanCount++;
      hasOrphanProperty = true;
    } else {
      const knowledge = JSON.parse(fs.readFileSync(kPath, 'utf8'));
      const missingFields = requiredFields.filter(f => !knowledge[f]);
      if (missingFields.length > 0) {
        errors.push(`Knowledge Defect: File "${kFile}" is missing fields: ${missingFields.join(', ')}`);
      }
    }

    // 4. Check Playbook File
    const pFile = `${key.toUpperCase()}.yaml`;
    const pPath = path.join(playbooksDir, pFile);
    if (!fs.existsSync(pPath)) {
      errors.push(`Orphan Node: Active leaf "${key}" is missing playbook file "${pFile}"`);
      orphanCount++;
      hasOrphanProperty = true;
    }

    // 5. Check Review Frequency (Governance review scheduling check)
    if (regEntry) {
      const lastReviewed = new Date(regEntry.lastReviewedAt);
      const frequencyDays = regEntry.reviewFrequencyDays || 180;
      const nextReviewDate = new Date(lastReviewed.getTime() + frequencyDays * 24 * 60 * 60 * 1000);
      
      if (new Date() > nextReviewDate) {
        errors.push(`Review Overdue: Scenario "${key}" review date is overdue since ${nextReviewDate.toISOString().split('T')[0]}`);
        overdueCount++;
      }
    }
  }

  const isSuccess = errors.length === 0 && orphanCount === 0 && overdueCount <= 5;

  return {
    success: isSuccess,
    errors,
    stats: {
      activeLeafNodes: activeLeaves.length,
      orphanNodes: orphanCount,
      overdueReviews: overdueCount
    }
  };
}

if (require.main === module) {
  const result = validateGovernance();
  console.log(`Governance validation complete. Success: ${result.success}`);
  if (result.errors.length > 0) {
    console.error('Validation Errors Found:\n' + result.errors.join('\n'));
    process.exit(1);
  }
  process.exit(0);
}
