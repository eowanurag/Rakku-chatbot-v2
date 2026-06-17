import * as fs from 'fs';
import * as path from 'path';
import { LegacyIntentAdapter } from '../adapters/legacy-intent-adapter';

export class RuleClassifier {
  private hindiKeywords: Record<string, any>;
  private hinglishKeywords: Record<string, any>;
  private categories: Record<string, string>;
  private intentsMetadata: Record<string, any>;
  private adapter: LegacyIntentAdapter;

  constructor() {
    this.adapter = new LegacyIntentAdapter();
    try {
      const findSharedFile = (filename: string): string => {
        let p = path.resolve(process.cwd(), 'shared/copilot', filename);
        if (fs.existsSync(p)) return p;
        p = path.resolve(process.cwd(), '../shared/copilot', filename);
        if (fs.existsSync(p)) return p;
        for (let i = 1; i <= 5; i++) {
          const dots = '../'.repeat(i);
          p = path.resolve(__dirname, dots, 'shared/copilot', filename);
          if (fs.existsSync(p)) return p;
        }
        return path.resolve(__dirname, filename);
      };

      const hindiPath = findSharedFile('hindi-keywords.json');
      const hinglishPath = findSharedFile('hinglish-keywords.json');
      const categoriesPath = findSharedFile('incident-categories.json');
      const intentsPath = findSharedFile('intents.json');

      this.hindiKeywords = JSON.parse(fs.readFileSync(hindiPath, 'utf8'));
      this.hinglishKeywords = JSON.parse(fs.readFileSync(hinglishPath, 'utf8'));
      this.categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
      
      const intentsData = JSON.parse(fs.readFileSync(intentsPath, 'utf8'));
      this.intentsMetadata = intentsData.intents || {};
    } catch (e) {
      console.error('Failed to load SAE dictionaries in RuleClassifier', e);
      this.hindiKeywords = {};
      this.hinglishKeywords = {};
      this.categories = {};
      this.intentsMetadata = {};
    }
  }

  public classify(text: string): { intent: string; category: string; confidence: number } | null {
    const cleanText = text.toLowerCase().trim();

    // 1. Dictionary Phrase Match Scoring
    let bestMatch: { intent: string; length: number } | null = null;

    const scanDictionary = (dict: Record<string, any>) => {
      for (const [key, value] of Object.entries(dict)) {
        if (Array.isArray(value)) {
          // It's a phrase array mapped to an intent key
          for (const phrase of value) {
            const cleanPhrase = phrase.toLowerCase().trim();
            if (cleanText.includes(cleanPhrase)) {
              // Priority given to the longest matching phrase
              if (!bestMatch || cleanPhrase.length > bestMatch.length) {
                bestMatch = { intent: key, length: cleanPhrase.length };
              }
            }
          }
        }
      }
    };

    scanDictionary(this.hindiKeywords);
    scanDictionary(this.hinglishKeywords);

    if (bestMatch) {
      const intent = (bestMatch as any).intent;
      const metadata = this.intentsMetadata[intent];
      return {
        intent,
        category: metadata?.category || this.categories[intent] || "UNKNOWN",
        confidence: metadata?.defaultConfidence || 0.95,
        scenarioHints: this.adapter.adapt(intent),
        hintSource: ["RULE_CLASSIFIER"],
        legacyIntent: intent
      };
    }

    // 2. Fallback to backward-compatible Single-Word keyword lookup
    const words = cleanText.split(/[\s,?.!]+/).filter(Boolean);
    for (const word of words) {
      if (this.hinglishKeywords[word] && typeof this.hinglishKeywords[word] === 'string') {
        const intent = this.hinglishKeywords[word];
        const metadata = this.intentsMetadata[intent];
        return {
          intent,
          category: metadata?.category || this.categories[intent] || "UNKNOWN",
          confidence: metadata?.defaultConfidence || 0.95,
          scenarioHints: this.adapter.adapt(intent),
          hintSource: ["RULE_CLASSIFIER"],
          legacyIntent: intent
        };
      }
      if (this.hindiKeywords[word] && typeof this.hindiKeywords[word] === 'string') {
        const intent = this.hindiKeywords[word];
        const metadata = this.intentsMetadata[intent];
        return {
          intent,
          category: metadata?.category || this.categories[intent] || "UNKNOWN",
          confidence: metadata?.defaultConfidence || 0.95,
          scenarioHints: this.adapter.adapt(intent),
          hintSource: ["RULE_CLASSIFIER"],
          legacyIntent: intent
        };
      }
    }

    return null;
  }
}
