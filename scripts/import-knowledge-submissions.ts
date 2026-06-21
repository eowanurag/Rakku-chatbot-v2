import * as fs from 'fs';
import * as path from 'path';
import * as jsyaml from 'js-yaml';

// Define paths
const rootDir = path.resolve(__dirname, '../');
const pendingDir = path.join(rootDir, 'shared/copilot/governance/submissions/pending');
const approvedDir = path.join(rootDir, 'shared/copilot/governance/submissions/approved');
const rejectedDir = path.join(rootDir, 'shared/copilot/governance/submissions/rejected');
const schemasDir = path.join(rootDir, 'shared/copilot/governance/schemas');
const graphsPath = path.join(rootDir, 'shared/copilot/scenario-graphs/graphs.json');
const outcomeRulesPath = path.join(rootDir, 'shared/copilot/outcome-rules/rules.json');
const registryPath = path.join(rootDir, 'shared/copilot/scenario-registry/scenario-registry.json');
const knowledgeDir = path.join(rootDir, 'shared/copilot/knowledge');
const playbooksDir = path.join(rootDir, 'shared/copilot/playbooks');
const qualityMetricsPath = path.join(rootDir, 'shared/copilot/governance/generated/scenario-quality.json');

// Make sure target directories exist
[approvedDir, rejectedDir, knowledgeDir, playbooksDir, path.dirname(registryPath), path.dirname(qualityMetricsPath)].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper to load JSON
function loadJson(p: string): any {
  if (fs.existsSync(p)) {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  return null;
}

// Helper to save JSON
function saveJson(p: string, data: any) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

export function importSubmissions() {
  console.log('--- KGL Import Pipeline Started ---');
  if (!fs.existsSync(pendingDir)) {
    fs.mkdirSync(pendingDir, { recursive: true });
    console.log('Created pending submissions folder. No submissions to process.');
    return;
  }

  const files = fs.readdirSync(pendingDir).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.log('No pending JSON submissions found.');
    return;
  }

  const graphs = loadJson(graphsPath);
  const outcomeRules = loadJson(outcomeRulesPath);
  let registry = loadJson(registryPath) || {};

  for (const file of files) {
    const filePath = path.join(pendingDir, file);
    let submission: any;
    try {
      submission = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e: any) {
      console.error(`Skipping invalid JSON file ${file}: ${e.message}`);
      fs.renameSync(filePath, path.join(rejectedDir, file));
      continue;
    }

    const { submissionType, scenarioKey } = submission;
    console.log(`Processing submission: ${file} (Type: ${submissionType}, Key: ${scenarioKey})`);

    let isValid = true;
    const errors: string[] = [];

    // Basic schema validations
    if (!submissionType || !scenarioKey) {
      isValid = false;
      errors.push('Missing submissionType or scenarioKey');
    }

    if (submissionType === 'NEW_SCENARIO') {
      const parent = submission.parentPath?.[submission.parentPath.length - 1];
      if (!graphs.nodes[parent]) {
        isValid = false;
        errors.push(`Parent path node "${parent}" does not exist in scenario graph.`);
      }
      if (graphs.nodes[scenarioKey]) {
        isValid = false;
        errors.push(`Scenario key "${scenarioKey}" already exists in graph.`);
      }
      if (!submission.owner || !submission.workflow || !submission.outcome) {
        isValid = false;
        errors.push('NEW_SCENARIO requires owner, workflow, and outcome mappings.');
      }
    } else if (submissionType === 'UPDATE') {
      if (!graphs.nodes[scenarioKey]) {
        isValid = false;
        errors.push(`Scenario key "${scenarioKey}" does not exist in graph to update.`);
      }
    } else if (submissionType === 'DEPRECATE') {
      if (!graphs.nodes[scenarioKey]) {
        isValid = false;
        errors.push(`Scenario key "${scenarioKey}" does not exist in graph to deprecate.`);
      }
    } else if (submissionType === 'NEW_CATEGORY') {
      if (!graphs.nodes[submission.parentNode]) {
        isValid = false;
        errors.push(`Parent node "${submission.parentNode}" does not exist.`);
      }
      if (graphs.nodes[scenarioKey]) {
        isValid = false;
        errors.push(`Category key "${scenarioKey}" already exists.`);
      }
    } else {
      isValid = false;
      errors.push(`Unknown submissionType: ${submissionType}`);
    }

    if (!isValid) {
      console.error(`Submission ${file} FAILED validation. Reasons:\n- ${errors.join('\n- ')}`);
      fs.renameSync(filePath, path.join(rejectedDir, file));
      continue;
    }

    // Execute submission operations
    if (submissionType === 'NEW_SCENARIO') {
      const parent = submission.parentPath[submission.parentPath.length - 1];
      
      // Update graph
      graphs.nodes[parent].children.push(scenarioKey);
      graphs.nodes[scenarioKey] = {
        version: 1,
        status: submission.status || 'ACTIVE',
        children: []
      };

      // Add outcome mapping
      outcomeRules.mappings[scenarioKey] = {
        outcomes: [submission.outcome]
      };

      // Write knowledge file
      const kPath = path.join(knowledgeDir, `${scenarioKey.toLowerCase()}.json`);
      const kData = {
        scenario: scenarioKey,
        description: submission.knowledge?.description || `Guidance for ${scenarioKey}`,
        eligibility: submission.knowledge?.eligibility || 'All citizens eligible',
        requiredInformation: submission.knowledge?.requiredInformation || [],
        requiredDocuments: submission.knowledge?.requiredDocuments || [],
        risks: submission.knowledge?.risks || 'Standard validation risk',
        escalationRules: submission.knowledge?.escalationRules || 'Escalate if unresolved',
        recommendedActions: submission.knowledge?.recommendedActions || [],
        officerGuidance: submission.knowledge?.officerGuidance || 'Verify credentials',
        citizenGuidance: submission.knowledge?.citizenGuidance || 'Submit registration form',
        references: submission.knowledge?.references || ['UPCOP Citizen Portal']
      };
      saveJson(kPath, kData);

      // Write playbook yaml
      const pPath = path.join(playbooksDir, `${scenarioKey.toUpperCase()}.yaml`);
      const pData = {
        goal: submission.playbook?.goal || `Help citizen resolve ${scenarioKey}`,
        clarification: {
          objective: submission.playbook?.clarification?.objective || 'gather_incident_details',
          maxAttempts: submission.playbook?.clarification?.maxAttempts || 2,
          informationGain: submission.playbook?.clarification?.informationGain || 'HIGH'
        },
        clarificationQuestions: submission.playbook?.clarificationQuestions || [],
        actions: submission.playbook?.actions || []
      };
      fs.writeFileSync(pPath, jsyaml.dump(pData), 'utf8');

      // Update registry
      registry[scenarioKey] = {
        scenarioKey,
        status: submission.status || 'ACTIVE',
        introducedVersion: '2.7.7',
        lastReviewedVersion: '2.7.7',
        reviewFrequencyDays: 180,
        lastReviewedAt: new Date().toISOString().split('T')[0],
        owner: submission.owner,
        workflow: submission.workflow,
        outcome: submission.outcome,
        knowledge: `${scenarioKey.toLowerCase()}.json`,
        playbook: `${scenarioKey.toUpperCase()}.yaml`
      };

    } else if (submissionType === 'UPDATE') {
      const kPath = path.join(knowledgeDir, `${scenarioKey.toLowerCase()}.json`);
      if (fs.existsSync(kPath)) {
        const currentK = loadJson(kPath);
        const updatedK = { ...currentK, ...submission.changes };
        saveJson(kPath, updatedK);
      }
      if (registry[scenarioKey]) {
        registry[scenarioKey].lastReviewedAt = new Date().toISOString().split('T')[0];
        registry[scenarioKey].lastReviewedVersion = '2.7.7';
      }

    } else if (submissionType === 'DEPRECATE') {
      if (graphs.nodes[scenarioKey]) {
        graphs.nodes[scenarioKey].status = 'DEPRECATED';
      }
      if (registry[scenarioKey]) {
        registry[scenarioKey].status = 'DEPRECATED';
      }

    } else if (submissionType === 'NEW_CATEGORY') {
      const parent = submission.parentNode;
      graphs.nodes[parent].children.push(scenarioKey);
      graphs.nodes[scenarioKey] = {
        version: 1,
        status: 'ACTIVE',
        children: []
      };
    }

    // Move to approved
    fs.renameSync(filePath, path.join(approvedDir, file));
    console.log(`Successfully approved and processed submission ${file}`);
  }

  // Save changes
  saveJson(graphsPath, graphs);
  saveJson(outcomeRulesPath, outcomeRules);
  saveJson(registryPath, registry);

  console.log('--- KGL Import Pipeline Finished ---');
}

if (require.main === module) {
  importSubmissions();
}
