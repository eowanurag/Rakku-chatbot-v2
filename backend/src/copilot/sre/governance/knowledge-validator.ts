import * as fs from 'fs';
import * as path from 'path';

export class KnowledgeValidator {
  static validate(knowledgeDir: string) {
    if (!fs.existsSync(knowledgeDir)) return;

    const files = fs.readdirSync(knowledgeDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const data = JSON.parse(fs.readFileSync(path.join(knowledgeDir, file), 'utf8'));
        if (!data.scenario) {
          throw new Error(`Knowledge validation failed: Missing scenario in ${file}`);
        }
        if (!data.authority) {
          throw new Error(`Knowledge validation failed: Missing authority in ${file}`);
        }
        if (!data.requiredInformation) {
          throw new Error(`Knowledge validation failed: Missing requiredInformation in ${file}`);
        }
      }
    }
  }
}
