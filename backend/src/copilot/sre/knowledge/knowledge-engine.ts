import * as fs from 'fs';
import * as path from 'path';

export class KnowledgeEngine {
  private knowledgeDir: string;

  constructor(basePath: string) {
    this.knowledgeDir = `${basePath}/knowledge`;
  }

  getKnowledge(scenario: string): any {
    const filePath = path.join(this.knowledgeDir, `${scenario.toLowerCase()}.json`);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return { requiredInformation: [] };
  }
}
