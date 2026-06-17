import * as fs from 'fs';

export class InformationGainPlanner {
  private rulesPath: string;
  private playbooksDir: string;

  constructor(basePath: string) {
    this.rulesPath = `${basePath}/clarification-rules/rules.json`;
    this.playbooksDir = `${basePath}/playbooks`;
  }

  getBestQuestion(scenario: string, askedQuestions: string[], currentRisk: string): { questionId: string; text: string, gain: number } | null {
    const rules = fs.existsSync(this.rulesPath) ? JSON.parse(fs.readFileSync(this.rulesPath, 'utf8')) : { maxBudget: 3 };
    const maxBudget = rules.maxBudget || 3;

    if (askedQuestions.length >= maxBudget) {
      return null; // Budget exhausted
    }

    const playbookPath = `${this.playbooksDir}/${scenario}.yaml`;
    if (!fs.existsSync(playbookPath)) return null;

    const content = fs.readFileSync(playbookPath, 'utf8');
    const lines = content.split('\n');
    const questions: any[] = [];
    
    let currentQ: any = null;
    for (const line of lines) {
      if (line.includes('- id:')) currentQ = { id: line.split(':')[1].trim().replace(/"/g, '') };
      if (line.includes('text:') && currentQ) currentQ.text = line.split('text:')[1].trim().replace(/"/g, '');
      if (line.includes('baseInformationGain:') && currentQ) {
        currentQ.gain = parseInt(line.split(':')[1].trim());
        questions.push(currentQ);
        currentQ = null;
      }
    }

    const unasked = questions.filter(q => !askedQuestions.includes(q.id));
    if (unasked.length === 0) return null;

    // Apply risk multiplier if HIGH_RISK
    unasked.forEach(q => {
      if (currentRisk === 'HIGH' || currentRisk === 'CRITICAL') {
        q.gain *= (rules.dynamicGainModifiers?.HIGH_RISK || 1.0);
      }
    });

    unasked.sort((a, b) => b.gain - a.gain);
    return { questionId: unasked[0].id, text: unasked[0].text, gain: unasked[0].gain };
  }
}
