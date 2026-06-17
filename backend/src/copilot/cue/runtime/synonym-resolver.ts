import * as fs from 'fs';
import * as path from 'path';
import { TransformationLogEntry } from './dictionary-normalizer';

export class SynonymResolver {
  private synonyms: any;

  constructor() {
    try {
      this.synonyms = this.loadSharedJson('understanding/synonyms.json');
    } catch (e) {
      this.synonyms = { version: "0.0.0", entries: {} };
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
    return this.synonyms.version || "1.0.0";
  }

  public normalize(text: string, log: TransformationLogEntry[]): string {
    if (!this.synonyms.entries) return text;

    const words = text.split(/\s+/);
    const version = this.getVersion();
    
    const resolved = words.map(w => {
      const canonical = w.toLowerCase();
      
      // Direct key lookup
      if (this.synonyms.entries[w]) {
        const toVal = this.synonyms.entries[w];
        log.push({
          from: w,
          to: toVal,
          source: "SYNONYM",
          dictionaryVersion: version
        });
        return toVal;
      }
      
      // Case-insensitive fallback lookup
      for (const key of Object.keys(this.synonyms.entries)) {
        if (key.toLowerCase() === canonical) {
          const toVal = this.synonyms.entries[key];
          log.push({
            from: w,
            to: toVal,
            source: "SYNONYM",
            dictionaryVersion: version
          });
          return toVal;
        }
      }
      
      return w;
    });

    return resolved.join(" ");
  }
}
