import * as fs from 'fs';
import * as path from 'path';
import * as jsyaml from 'js-yaml';

const rootDir = path.resolve(__dirname, '../');
const graphsPath = path.join(rootDir, 'shared/copilot/scenario-graphs/graphs.json');
const knowledgeDir = path.join(rootDir, 'shared/copilot/knowledge');
const playbooksDir = path.join(rootDir, 'shared/copilot/playbooks');
const registryPath = path.join(rootDir, 'shared/copilot/scenario-registry/scenario-registry.json');
const outcomeRulesPath = path.join(rootDir, 'shared/copilot/outcome-rules/rules.json');

function runPopulation() {
  console.log('--- Initializing V2.7.8 Configuration Auto-Population ---');

  const graphs = JSON.parse(fs.readFileSync(graphsPath, 'utf8'));
  const outcomeRules = JSON.parse(fs.readFileSync(outcomeRulesPath, 'utf8'));
  let registry = fs.existsSync(registryPath) ? JSON.parse(fs.readFileSync(registryPath, 'utf8')) : {};

  const activeNodes = Object.entries(graphs.nodes).filter(
    ([, node]: [string, any]) => node.status === 'ACTIVE'
  );

  const activeLeaves = activeNodes.filter(
    ([, node]: [string, any]) => !node.children || node.children.length === 0
  );

  console.log(`Active leaf nodes count: ${activeLeaves.length}`);

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
    const kFile = `${key.toLowerCase()}.json`;
    const kPath = path.join(knowledgeDir, kFile);
    
    // Determine mapping defaults
    const isSafety = key === 'KIDNAPPING' || key === 'ASSAULT' || key === 'DOMESTIC_VIOLENCE' || key === 'EMERGENCY' || key === 'ACCIDENT' || key === 'CHILD_MISSING' || key === 'WOMEN_SAFETY';
    const isService = key.endsWith('_CERTIFICATE') || key.endsWith('_VERIFICATION');
    const workflow = isSafety ? 'SAFETY_ESCALATION' : (isService ? 'CITIZEN_SERVICES' : 'COMPLAINT_FILING');
    const outcome = isSafety ? 'EMERGENCY_ESCALATION' : (isService ? 'SERVICE_FULFILLMENT' : 'DOCUMENT_REPLACEMENT');

    // 1. Create or update Knowledge JSON file
    let kData: any = {};
    if (fs.existsSync(kPath)) {
      kData = JSON.parse(fs.readFileSync(kPath, 'utf8'));
    }

    kData.scenario = kData.scenario || key;
    kData.description = kData.description || `Official guidelines and details for handling ${key} scenarios.`;
    kData.eligibility = kData.eligibility || 'All citizens residing in Uttar Pradesh.';
    kData.requiredInformation = kData.requiredInformation || ['incidentDate', 'incidentLocation'];
    kData.requiredDocuments = kData.requiredDocuments || ['Identity Proof (Aadhaar/PAN)'];
    kData.risks = kData.risks || 'Potential delays if documentation is incomplete.';
    kData.escalationRules = kData.escalationRules || (isSafety ? 'Escalate immediately to emergency response unit.' : 'Escalate to Superintendent if unresolved in 15 days.');
    kData.recommendedActions = kData.recommendedActions || ['Lodge report online via portal', 'Obtain unique reference key'];
    kData.officerGuidance = kData.officerGuidance || 'Verify the applicant credentials and assign to the target station.';
    kData.citizenGuidance = kData.citizenGuidance || 'Ensure all details provided are complete and true.';
    kData.references = kData.references || ['Uttar Pradesh Police Citizen Services Manual'];

    // Ensure all 10 fields exist
    requiredFields.forEach(f => {
      if (!kData[f]) kData[f] = '';
    });

    fs.writeFileSync(kPath, JSON.stringify(kData, null, 2), 'utf8');

    // 2. Create or update Playbook YAML file
    const pFile = `${key.toUpperCase()}.yaml`;
    const pPath = path.join(playbooksDir, pFile);
    let pData: any = {};

    if (fs.existsSync(pPath)) {
      try {
        pData = jsyaml.load(fs.readFileSync(pPath, 'utf8')) || {};
      } catch (e) {
        pData = {};
      }
    }

    pData.goal = pData.goal || `Help citizen resolve ${key}`;
    pData.clarification = pData.clarification || {
      objective: 'gather_incident_details',
      maxAttempts: 2,
      informationGain: 'HIGH'
    };
    pData.clarificationQuestions = pData.clarificationQuestions || [
      {
        id: 'incident_details',
        text: `Can you tell me where and when the ${key.toLowerCase()} incident took place?`,
        baseInformationGain: 85
      }
    ];
    pData.actions = pData.actions || [`Initiate ${workflow}`];
    pData.resolutionCriteria = pData.resolutionCriteria || `All required fields for ${key} are filled`;
    pData.escalationCriteria = pData.escalationCriteria || isSafety ? 'Immediate physical danger reported' : 'No response from citizen for 48 hours';

    fs.writeFileSync(pPath, jsyaml.dump(pData), 'utf8');

    // 3. Update outcome rules rules.json mapping
    if (!outcomeRules.mappings[key]) {
      outcomeRules.mappings[key] = {
        outcomes: [outcome]
      };
    }

    // 4. Update scenario registry
    registry[key] = {
      scenarioKey: key,
      status: 'ACTIVE',
      introducedVersion: '2.7.8',
      lastReviewedVersion: '2.7.8',
      reviewFrequencyDays: 180,
      lastReviewedAt: '2026-06-19',
      owner: isSafety ? 'UP_POLICE_EMERGENCY' : (isService ? 'UPCOP_PORTAL' : 'LOCAL_POLICE_STATION'),
      workflow,
      outcome,
      knowledge: kFile,
      playbook: pFile
    };
  }

  // Save registries & outcomes
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf8');
  fs.writeFileSync(outcomeRulesPath, JSON.stringify(outcomeRules, null, 2), 'utf8');

  console.log('--- V2.7.8 Auto-Population Completed Successfully ---');
}

runPopulation();
