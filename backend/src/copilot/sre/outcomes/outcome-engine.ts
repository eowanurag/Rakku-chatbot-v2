import * as fs from 'fs';

export class OutcomeEngine {
  private rulesPath: string;

  constructor(basePath: string) {
    this.rulesPath = `${basePath}/outcome-rules/rules.json`;
  }

  determineOutcome(scenario: string, confidence: number, budgetExhausted: boolean, requiresImmediateEscalation: boolean): string {
    if (requiresImmediateEscalation) return 'EMERGENCY_ESCALATION';

    let fallbacks: any = {};
    let mappings: any = {};
    if (fs.existsSync(this.rulesPath)) {
      const data = JSON.parse(fs.readFileSync(this.rulesPath, 'utf8'));
      fallbacks = data.fallbacks || {};
      mappings = data.mappings || {};
    }

    if (confidence < 0.6) {
      if (budgetExhausted) {
        return fallbacks.contradictions || 'OFFICER_REVIEW';
      } else {
        return 'CLARIFICATION_REQUIRED';
      }
    }

    const mapping = mappings[scenario];
    if (mapping && mapping.outcomes && mapping.outcomes.length > 0) {
      return mapping.outcomes[0];
    }

    return 'DEFAULT_WORKFLOW';
  }
}
