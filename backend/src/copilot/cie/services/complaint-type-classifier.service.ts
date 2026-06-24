import { Injectable } from '@nestjs/common';
import { COMPLAINT_TYPE_ALIASES } from '../config/complaint-type-alias.config';
import { normalizeComplaintText, normalizeSelection } from '../../../chat/utils/citizen-input.util';

export interface ComplaintClassificationResult {
  matches: string[];
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  score: number;
}

@Injectable()
export class ComplaintTypeClassifierService {
  private readonly typeMapping: Record<string, string> = {
    'lost mobile / theft': 'Lost Mobile / Theft',
    'lost mobile': 'Lost Mobile / Theft',
    'lost mobile/theft': 'Lost Mobile / Theft',
    'mobile theft': 'Lost Mobile / Theft',
    'lost document': 'Lost Document',
    'cyber fraud / financial loss': 'Cyber Fraud / Financial Loss',
    'cyber fraud': 'Cyber Fraud / Financial Loss',
    'cyber fraud/financial loss': 'Cyber Fraud / Financial Loss',
    'simple harassment': 'Simple Harassment',
    'harassment': 'Simple Harassment'
  };

  private readonly keywordSets: Record<string, string[]> = {
    'Lost Mobile / Theft': ['phone', 'mobile', 'iphone', 'android', 'sim', 'device', 'stolen phone'],
    'Lost Document': ['wallet', 'purse', 'bag', 'passport', 'aadhaar', 'pan', 'documents', 'certificate', 'id card', 'license'],
    'Cyber Fraud / Financial Loss': ['fraud', 'upi', 'bank', 'money', 'otp', 'scam', 'transaction'],
    'Simple Harassment': ['harassment', 'abuse', 'threat', 'stalking', 'bullying']
  };

  classify(input: string): ComplaintClassificationResult {
    if (!input) {
      return { matches: [], confidence: 'LOW', score: 0 };
    }

    const normalized = normalizeSelection(input).trim();
    const normalizedLower = normalized.toLowerCase();

    for (const [key, value] of Object.entries(this.typeMapping)) {
      if (normalizedLower === key) {
        return { matches: [value], confidence: 'HIGH', score: 1.0 };
      }
    }

    const cleanText = normalizeComplaintText(input);
    const words = cleanText.split(' ');

    const aliasMatches: string[] = [];
    for (const item of COMPLAINT_TYPE_ALIASES) {
      for (const alias of item.aliases) {
        if (cleanText.includes(alias)) {
          if (!aliasMatches.includes(item.complaintType)) {
            aliasMatches.push(item.complaintType);
          }
        }
      }
    }

    const typeScores: Record<string, number> = {
      'Lost Mobile / Theft': 0,
      'Lost Document': 0,
      'Cyber Fraud / Financial Loss': 0,
      'Simple Harassment': 0
    };

    // Initialize scores with alias matches (weight 0.95)
    for (const type of aliasMatches) {
      typeScores[type] = 0.95;
    }

    for (const [type, keywords] of Object.entries(this.keywordSets)) {
      let matchCount = 0;
      for (const keyword of keywords) {
        if (words.includes(keyword) || cleanText.includes(keyword)) {
          matchCount++;
        }
      }
      if (matchCount > 0) {
        const keywordScore = Math.min(0.85, 0.4 + 0.15 * matchCount);
        if (keywordScore > typeScores[type]) {
          typeScores[type] = keywordScore;
        }
      }
    }

    const matchedTypes = Object.keys(typeScores)
      .filter(type => typeScores[type] >= 0.5)
      .sort((a, b) => typeScores[b] - typeScores[a]);

    if (matchedTypes.length === 0) {
      return { matches: [], confidence: 'LOW', score: 0.0 };
    }

    const topType = matchedTypes[0];
    const topScore = typeScores[topType];

    let confidence: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (matchedTypes.length > 1) {
      confidence = 'MEDIUM';
    } else if (topScore >= 0.8) {
      confidence = 'HIGH';
    } else if (topScore >= 0.5) {
      confidence = 'MEDIUM';
    }

    return {
      matches: matchedTypes,
      confidence,
      score: topScore
    };
  }

  canClassify(input: string): boolean {
    const res = this.classify(input);
    return res.matches.length > 0;
  }
}
