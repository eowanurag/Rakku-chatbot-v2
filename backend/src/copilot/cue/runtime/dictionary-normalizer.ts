import * as fs from 'fs';
import * as path from 'path';

export interface TransformationLogEntry {
  from: string;
  to: string;
  source: "DIALECT" | "SYNONYM" | "ABBREVIATION";
  dictionaryVersion: string;
}

export class DictionaryNormalizer {
  private rules: any;
  private abbreviations: any;

  constructor() {
    try {
      this.rules = this.loadSharedJson('understanding/normalization-rules.json');
      this.abbreviations = this.loadSharedJson('understanding/abbreviations.json');
    } catch (e) {
      this.rules = { version: "0.0.0", stripPunctuation: true, lowercase: true };
      this.abbreviations = { version: "0.0.0", entries: {} };
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

  public getRulesVersion(): string {
    return this.rules.version || "1.0.0";
  }

  public getAbbreviationsVersion(): string {
    return this.abbreviations.version || "1.0.0";
  }

  public normalize(text: string, log: TransformationLogEntry[]): string {
    let result = text;

    if (this.rules.lowercase) {
      result = result.toLowerCase();
    }

    if (this.rules.stripPunctuation) {
      // Remove common punctuation except keep words intact
      result = result.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, " ");
      result = result.replace(/\s+/g, " ");
    }

    result = result.trim();

    // Map abbreviations token by token
    const words = result.split(/\s+/);
    const version = this.getAbbreviationsVersion();
    const replacedWords = words.map(w => {
      const canonical = w.toLowerCase();
      if (this.abbreviations.entries && this.abbreviations.entries[canonical]) {
        const toVal = this.abbreviations.entries[canonical];
        log.push({
          from: w,
          to: toVal,
          source: "ABBREVIATION",
          dictionaryVersion: version
        });
        return toVal;
      }
      return w;
    });

    return replacedWords.join(" ");
  }
}
