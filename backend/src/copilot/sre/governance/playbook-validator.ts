import * as fs from 'fs';
import * as path from 'path';

export class PlaybookValidator {
  static validate(playbookDir: string) {
    if (!fs.existsSync(playbookDir)) return;

    const files = fs.readdirSync(playbookDir);
    for (const file of files) {
      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        const content = fs.readFileSync(path.join(playbookDir, file), 'utf8');
        if (!content.includes('goal:')) {
          throw new Error(`Playbook validation failed: Missing goal in ${file}`);
        }
        if (!content.includes('actions:')) {
          throw new Error(`Playbook validation failed: Missing actions in ${file}`);
        }
      }
    }
  }
}
