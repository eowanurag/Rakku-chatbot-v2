import * as fs from 'fs';
import * as path from 'path';

const rootDir = path.resolve(__dirname, '..');
const sharedDir = path.join(rootDir, 'shared/copilot');

function initialize() {
  const graphsPath = path.join(sharedDir, 'scenario-graphs/graphs.json');
  if (!fs.existsSync(graphsPath)) {
    console.error('graphs.json does not exist');
    return;
  }

  const graphsData = JSON.parse(fs.readFileSync(graphsPath, 'utf8'));
  const nodes = Object.keys(graphsData.nodes || {});

  // 1. Create missing Knowledge Files
  const knowledgeDir = path.join(sharedDir, 'knowledge');
  if (!fs.existsSync(knowledgeDir)) {
    fs.mkdirSync(knowledgeDir, { recursive: true });
  }

  // 2. Create missing Playbook Files
  const playbooksDir = path.join(sharedDir, 'playbooks');
  if (!fs.existsSync(playbooksDir)) {
    fs.mkdirSync(playbooksDir, { recursive: true });
  }

  // 3. Load existing Risk Rules
  const riskRulesPath = path.join(sharedDir, 'risk-rules/rules.json');
  let riskRules = { scenarios: {} as Record<string, any> };
  if (fs.existsSync(riskRulesPath)) {
    try {
      riskRules = JSON.parse(fs.readFileSync(riskRulesPath, 'utf8'));
    } catch (e) {}
  }

  // 4. Load existing Outcome Rules
  const outcomeRulesPath = path.join(sharedDir, 'outcome-rules/rules.json');
  let outcomeRules = { mappings: {} as Record<string, any>, fallbacks: {} as Record<string, any> };
  if (fs.existsSync(outcomeRulesPath)) {
    try {
      outcomeRules = JSON.parse(fs.readFileSync(outcomeRulesPath, 'utf8'));
    } catch (e) {}
  }

  // 5. Load existing Service Mappings
  const serviceMappingsPath = path.join(sharedDir, 'service-mappings.json');
  let serviceMappings = { version: '1.0', lastUpdated: '2026-06-18', mappings: {} as Record<string, any> };
  if (fs.existsSync(serviceMappingsPath)) {
    try {
      serviceMappings = JSON.parse(fs.readFileSync(serviceMappingsPath, 'utf8'));
    } catch (e) {}
  }

  // Define defaults for new nodes
  for (const node of nodes) {
    const nodeLower = node.toLowerCase();
    const nodeUpper = node.toUpperCase();

    // Create knowledge stub
    const kFile = path.join(knowledgeDir, `${nodeLower}.json`);
    if (!fs.existsSync(kFile)) {
      const isEscalation = nodeUpper === 'KIDNAPPING' || nodeUpper === 'ASSAULT' || nodeUpper === 'DOMESTIC_VIOLENCE' || nodeUpper === 'EMERGENCY_ASSISTANCE';
      const knowledgeStub = {
        scenario: nodeUpper,
        description: `Guidance and steps for handling ${nodeUpper} scenario.`,
        authority: isEscalation ? 'POLICE_EMERGENCY' : 'UP_CITIZEN_SERVICES',
        outcomes: isEscalation ? ['EMERGENCY_ESCALATION'] : ['DOCUMENT_REPLACEMENT'],
        defaultRisk: isEscalation ? 'CRITICAL' : 'LOW',
        citizenRisks: isEscalation ? 'High threat to life or safety.' : 'Minor inconvenience or administrative delay.',
        recommendedActions: isEscalation ? ['Call emergency hotline 112', 'Seek safe shelter'] : [`Request official details for ${nodeUpper}`],
        requiredInformation: ['misuseSuspected'],
        escalationGuidance: isEscalation ? 'Immediate dispatch of police responders required.' : 'Escalate to officer review if applicant is unsatisfied.'
      };
      fs.writeFileSync(kFile, JSON.stringify(knowledgeStub, null, 2), 'utf8');
      console.log(`Created knowledge stub: ${nodeLower}.json`);
    }

    // Create playbook stub
    const pFile = path.join(playbooksDir, `${nodeUpper}.yaml`);
    if (!fs.existsSync(pFile)) {
      const isEscalation = nodeUpper === 'KIDNAPPING' || nodeUpper === 'ASSAULT' || nodeUpper === 'DOMESTIC_VIOLENCE' || nodeUpper === 'EMERGENCY_ASSISTANCE';
      const playbookStub = `goal: "Help citizen manage ${nodeUpper} situation"
clarificationQuestions:
  - id: "misuse_suspected"
    text: "Do you suspect any immediate threat or misuse in this ${nodeLower}?"
    baseInformationGain: 80
actions:
  - "${isEscalation ? 'Initiate emergency police escalation workflow' : 'Provide replacement procedure info'}"
`;
      fs.writeFileSync(pFile, playbookStub, 'utf8');
      console.log(`Created playbook stub: ${nodeUpper}.yaml`);
    }

    // Populate Risk Rules
    if (!riskRules.scenarios[nodeUpper]) {
      const isEscalation = nodeUpper === 'KIDNAPPING' || nodeUpper === 'ASSAULT' || nodeUpper === 'DOMESTIC_VIOLENCE' || nodeUpper === 'EMERGENCY_ASSISTANCE';
      riskRules.scenarios[nodeUpper] = {
        baseRisk: isEscalation ? 'CRITICAL' : 'LOW',
        modifiers: [
          {
            condition: 'misuseSuspected == true',
            newRisk: 'HIGH'
          }
        ]
      };
    }

    // Populate Outcome Rules
    if (!outcomeRules.mappings[nodeUpper]) {
      const isEscalation = nodeUpper === 'KIDNAPPING' || nodeUpper === 'ASSAULT' || nodeUpper === 'DOMESTIC_VIOLENCE' || nodeUpper === 'EMERGENCY_ASSISTANCE';
      outcomeRules.mappings[nodeUpper] = {
        outcomes: isEscalation ? ['EMERGENCY_ESCALATION'] : ['DOCUMENT_REPLACEMENT']
      };
    }

    // Populate Service Mappings
    // Every scenario node (or its outcome) must map to a workflow
    // Let's map the outcomes first:
    const isEscalation = nodeUpper === 'KIDNAPPING' || nodeUpper === 'ASSAULT' || nodeUpper === 'DOMESTIC_VIOLENCE' || nodeUpper === 'EMERGENCY_ASSISTANCE';
    const outcomeName = isEscalation ? 'EMERGENCY_ESCALATION' : 'DOCUMENT_REPLACEMENT';
    if (!serviceMappings.mappings[outcomeName]) {
      serviceMappings.mappings[outcomeName] = {
        workflowId: isEscalation ? 'guidance' : 'complaint',
        displayName: isEscalation ? 'Emergency Escalation Workflow' : 'Document Replacement/Loss Report Workflow',
        requiresPrerequisites: false
      };
    }
    // Also map the node name directly just in case:
    if (!serviceMappings.mappings[nodeUpper]) {
      serviceMappings.mappings[nodeUpper] = {
        workflowId: isEscalation ? 'guidance' : 'complaint',
        displayName: `${nodeUpper} Service Workflow`,
        requiresPrerequisites: false
      };
    }
  }

  // Ensure default fallback outcomes exist in outcome rules
  if (!outcomeRules.fallbacks) {
    outcomeRules.fallbacks = {};
  }
  if (!outcomeRules.fallbacks.budgetExhausted_lowConfidence) {
    outcomeRules.fallbacks.budgetExhausted_lowConfidence = 'FALLBACK_GUIDANCE';
  }
  if (!outcomeRules.fallbacks.contradictions) {
    outcomeRules.fallbacks.contradictions = 'OFFICER_REVIEW';
  }

  // Write rules files back
  fs.writeFileSync(riskRulesPath, JSON.stringify(riskRules, null, 2), 'utf8');
  console.log(`Updated risk rules.`);
  fs.writeFileSync(outcomeRulesPath, JSON.stringify(outcomeRules, null, 2), 'utf8');
  console.log(`Updated outcome rules.`);
  fs.writeFileSync(serviceMappingsPath, JSON.stringify(serviceMappings, null, 2), 'utf8');
  console.log(`Updated service mappings.`);
}

initialize();
