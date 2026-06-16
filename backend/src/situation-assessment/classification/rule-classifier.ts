import * as fs from 'fs';
import * as path from 'path';

export class RuleClassifier {
  private hindiKeywords: Record<string, string>;
  private hinglishKeywords: Record<string, string>;
  private categories: Record<string, string>;

  constructor() {
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

      this.hindiKeywords = JSON.parse(fs.readFileSync(hindiPath, 'utf8'));
      this.hinglishKeywords = JSON.parse(fs.readFileSync(hinglishPath, 'utf8'));
      this.categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
    } catch (e) {
      console.error('Failed to load SAE dictionaries in RuleClassifier', e);
      this.hindiKeywords = {};
      this.hinglishKeywords = {};
      this.categories = {};
    }
  }

  public classify(text: string): { intent: string; category: string; confidence: number } | null {
    const cleanText = text.toLowerCase().trim();
    const words = cleanText.split(/[\s,?.!]+/).filter(Boolean);

    // Look for exact keyword matches
    for (const word of words) {
      if (this.hinglishKeywords[word]) {
        const intent = this.hinglishKeywords[word];
        return {
          intent,
          category: this.categories[intent] || "UNKNOWN",
          confidence: 1.0 // Keyword matched exactly
        };
      }
      if (this.hindiKeywords[word]) {
        const intent = this.hindiKeywords[word];
        return {
          intent,
          category: this.categories[intent] || "UNKNOWN",
          confidence: 1.0
        };
      }
    }

    return null;
  }
}
