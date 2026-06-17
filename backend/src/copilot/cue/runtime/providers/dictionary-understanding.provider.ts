import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { UnderstandingProvider } from './understanding-provider.interface';
import { CueResult } from '../../interfaces/cue-result.interface';
import { NarrativeNormalizer } from '../narrative-normalizer';
import { UnderstandingValidator } from '../understanding-validator';
import { CueEventsEmitter } from '../../telemetry/cue-events';

@Injectable()
export class DictionaryUnderstandingProvider implements UnderstandingProvider {
  private normalizer: NarrativeNormalizer;
  private validator: UnderstandingValidator;
  private dictionaryWords: Set<string>;

  constructor() {
    this.normalizer = new NarrativeNormalizer();
    this.validator = new UnderstandingValidator();
    this.dictionaryWords = new Set<string>();
    this.buildDictionarySet();
  }

  private buildDictionarySet() {
    try {
      const loadKeysValues = (subpath: string) => {
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
        if (fs.existsSync(p)) {
          const dict = JSON.parse(fs.readFileSync(p, 'utf8'));
          if (dict.entries) {
            for (const key of Object.keys(dict.entries)) {
              this.dictionaryWords.add(key.toLowerCase());
              const val = dict.entries[key];
              if (typeof val === 'string') {
                this.dictionaryWords.add(val.toLowerCase());
              }
            }
          }
        }
      };

      loadKeysValues('understanding/synonyms.json');
      loadKeysValues('understanding/dialects.json');
      loadKeysValues('understanding/abbreviations.json');
    } catch (e) {
      // Ignore
    }
  }

  public async understand(narrative: string, sessionId = "default"): Promise<CueResult> {
    const startTime = Date.now();
    const { normalized, log } = this.normalizer.normalize(narrative);
    const validation = this.validator.validate(narrative, normalized, log, this.dictionaryWords);
    const endTime = Date.now();
    const processingTimeMs = endTime - startTime;

    // Load versions
    const versions = this.normalizer.getDictionaryVersions();

    // Map scenario hints
    const scenarioHints: { root: string; branch?: string; leaf?: string; confidence: number }[] = [];
    const normalizedLower = normalized.toLowerCase();
    
    if (normalizedLower.includes("aadhaar")) {
      scenarioHints.push({ root: "LOSS", branch: "DOCUMENT", leaf: "AADHAAR", confidence: 0.95 });
    } else if (normalizedLower.includes("mobile") || normalizedLower.includes("phone")) {
      scenarioHints.push({ root: "LOSS", branch: "DOCUMENT", leaf: "MOBILE", confidence: 0.95 });
    } else if (normalizedLower.includes("wallet") || normalizedLower.includes("purse") || normalizedLower.includes("bag")) {
      scenarioHints.push({ root: "LOSS", branch: "DOCUMENT", leaf: "WALLET", confidence: 0.95 });
    } else if (normalizedLower.includes("stole") || normalizedLower.includes("chori") || normalizedLower.includes("theft")) {
      scenarioHints.push({ root: "THEFT", confidence: 0.90 });
    } else if (normalizedLower.includes("fraud") || normalizedLower.includes("cyber") || normalizedLower.includes("upi")) {
      scenarioHints.push({ root: "FRAUD", branch: "CYBER", confidence: 0.90 });
    }

    return {
      originalNarrative: narrative,
      normalizedNarrative: normalized,
      language: validation.language,
      languageConfidence: validation.languageConfidence,
      entities: [],
      transformationLog: log,
      unknownTerms: validation.unknownTerms,
      normalizationConfidence: validation.normalizationConfidence,
      understandingConfidence: validation.understandingConfidence,
      understandingBand: validation.understandingBand,
      understandingStatus: validation.understandingStatus,
      usedAI: false,
      requiresAIReview: validation.requiresAIReview,
      cueDictionaryVersions: versions,
      scenarioHints,
      provider: "DICTIONARY",
      processingTimeMs,
      dictionaryReleaseVersion: versions.synonyms
    };
  }
}
