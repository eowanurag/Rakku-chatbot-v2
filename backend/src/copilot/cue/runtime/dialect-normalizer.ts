import * as fs from 'fs';
import * as path from 'path';
import { TransformationLogEntry } from './dictionary-normalizer';

export class DialectNormalizer {
  private dialects: any;

  constructor() {
    try {
      this.dialects = this.loadSharedJson('understanding/dialects.json');
    } catch (e) {
      this.dialects = { version: "0.0.0", entries: {} };
    }
  }

  private loadSharedJson(subpath: string): any {
    let p = path.resolve(process.cwd(), 'shared/copilot', subpath);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    p = path.resolve(process.cwd(), '../shared/copilot', subpath);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    for (let i = 1; i <= 5; i++) {
      const dots = '../'.repeat(i);
      const testPath = path.resolve(__dirname, dots, 'shared/copilot', subpath);
      if (fs.existsSync(testPath)) return JSON.parse(fs.readFileSync(testPath, 'utf8'));
    }
    throw new Error(`File not found: ${subpath}`);
  }

  public getVersion(): string {
    return this.dialects.version || "1.0.0";
  }

  public normalize(text: string, log: TransformationLogEntry[]): string {
    if (!this.dialects.entries) return text;
    
    let result = text;
    const version = this.getVersion();
    
    // Sort keys by word length (descending) to match phrases first
    const sortedKeys = Object.keys(this.dialects.entries).sort((a, b) => b.length - a.length);

    for (const key of sortedKeys) {
      const target = key.toLowerCase();
      const replacement = this.dialects.entries[key];
      
      // Use regex to perform a boundary-safe or phrase matching replacement
      // Match key inside word boundaries or simply as substring replacement for multiword
      if (result.includes(target)) {
        // We'll replace all occurrences
        const regex = new RegExp(this.escapeRegExp(target), 'gi');
        let matched = false;
        result = result.replace(regex, (match) => {
          matched = true;
          return replacement;
        });

        if (matched) {
          log.push({
            from: key,
            to: replacement,
            source: "DIALECT",
            dictionaryVersion: version
          });
        }
      }
    }

    return result;
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
