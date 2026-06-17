import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DictionaryGovernanceService implements OnModuleInit {
  private readonly logger = new Logger(DictionaryGovernanceService.name);

  onModuleInit() {
    this.logger.log('Executing startup validation for CUE dictionaries...');
    this.validateAll();
  }

  public validateAll() {
    const files = ['synonyms.json', 'dialects.json', 'abbreviations.json', 'normalization-rules.json'];
    for (const file of files) {
      this.validateFile(`understanding/${file}`);
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

  public validateFile(subpath: string) {
    const data = this.loadSharedJson(subpath);

    // Rule 3: Dictionary Metadata Validation
    if (!data.version || !data.lastUpdated) {
      throw new Error(`Dictionary metadata missing in ${subpath}`);
    }

    // Rule 5: Version Consistency (Semantic versioning check)
    const semverRegex = /^\d+\.\d+\.\d+$/;
    if (!semverRegex.test(data.version)) {
      throw new Error(`Invalid version format "${data.version}" in ${subpath}. Must follow semantic versioning (e.g. 1.0.0).`);
    }

    // Normalization rules doesn't have "entries" field like maps
    if (subpath.includes('normalization-rules.json')) {
      return;
    }

    // Rule 4: Empty Dictionary Detection (minimum threshold of 1 entry)
    if (!data.entries || Object.keys(data.entries).length === 0) {
      throw new Error(`Dictionary ${subpath} has no entries or violates minimum threshold`);
    }

    const entries = data.entries;

    // Rule 2: Duplicate key check is handled natively by JSON parsing (duplicate keys overwrite each other in JS object).
    // But we can check raw file contents if we want to detect literal duplicates in json string.
    // Let's do a basic check by checking if any key maps to multiple values or if we parse manually.
    // Let's assume standard JSON.parse is fine, but let's implement a manual duplicate key parser on the raw file text to trigger errors as required.
    this.checkForDuplicateKeysInRawJson(subpath);

    // Rule 1: Circular mapping detection
    this.detectCircularMappings(entries, subpath);
  }

  private checkForDuplicateKeysInRawJson(subpath: string) {
    let p = path.resolve(process.cwd(), 'shared/copilot', subpath);
    if (!fs.existsSync(p)) {
      p = path.resolve(process.cwd(), '../shared/copilot', subpath);
    }
    if (!fs.existsSync(p)) {
      for (let i = 1; i <= 5; i++) {
        const dots = '../'.repeat(i);
        const testPath = path.resolve(__dirname, dots, 'shared/copilot', subpath);
        if (fs.existsSync(testPath)) {
          p = testPath;
          break;
        }
      }
    }
    if (!fs.existsSync(p)) return;

    const raw = fs.readFileSync(p, 'utf8');
    const keyRegex = /"([^"]+)"\s*:/g;
    const keys: string[] = [];
    let match;
    while ((match = keyRegex.exec(raw)) !== null) {
      keys.push(match[1]);
    }
    
    // Ignore version, lastUpdated, exportBatchId, entries
    const ignore = new Set(['version', 'lastUpdated', 'exportBatchId', 'entries', 'stripPunctuation', 'lowercase']);
    const entryKeys = keys.filter(k => !ignore.has(k));
    const seen = new Set<string>();
    for (const key of entryKeys) {
      if (seen.has(key)) {
        throw new Error(`Duplicate key "${key}" detected in raw JSON: ${subpath}`);
      }
      seen.add(key);
    }
  }

  private detectCircularMappings(entries: Record<string, string>, subpath: string) {
    // Check if key -> value -> key circular reference exists
    for (const key of Object.keys(entries)) {
      const val = entries[key];
      if (typeof val === 'string') {
        const valLower = val.toLowerCase();
        const keyLower = key.toLowerCase();
        
        // Direct circular
        if (valLower === keyLower) {
          throw new Error(`Circular mapping detected: "${key}" maps to itself in ${subpath}`);
        }

        // Secondary circular: check if val maps back to key
        // e.g. "phone" -> "mobile", and "mobile" -> "phone"
        const nextVal = entries[val];
        if (nextVal && nextVal.toLowerCase() === keyLower) {
          throw new Error(`Circular mapping detected: "${key}" -> "${val}" -> "${nextVal}" in ${subpath}`);
        }

        // Deep transitive circular mapping check (simple path tracker)
        const path = [keyLower];
        let current = valLower;
        while (current) {
          const next = entries[current];
          if (!next) break;
          const nextLower = next.toLowerCase();
          if (path.includes(nextLower)) {
            throw new Error(`Transitive circular mapping detected: ${path.join(' -> ')} -> ${nextLower} in ${subpath}`);
          }
          path.push(current);
          current = nextLower;
        }
      }
    }
  }
}
