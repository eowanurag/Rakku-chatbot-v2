import { LegacyIntentAdapter } from '../adapters/legacy-intent-adapter';

export class PatternClassifier {
  private adapter = new LegacyIntentAdapter();
  private patterns: { regex: RegExp; intent: string; confidence: number }[] = [
    { regex: /upi\s+fraud/i, intent: "CYBER_FRAUD", confidence: 0.95 },
    { regex: /sim\s+swap/i, intent: "CYBER_FRAUD", confidence: 0.95 },
    { regex: /online\s+cheat/i, intent: "CYBER_FRAUD", confidence: 0.90 },
    { regex: /passport\s+(verify|verification)/i, intent: "CHARACTER_CERTIFICATE", confidence: 0.95 },
    { regex: /job\s+(clearance|verify|verification)/i, intent: "CHARACTER_CERTIFICATE", confidence: 0.95 },
    { regex: /tenant\s+(moved|live|stay|rent|verification)/i, intent: "TENANT_VERIFICATION", confidence: 0.95 },
    { regex: /kirayedar/i, intent: "TENANT_VERIFICATION", confidence: 0.90 },
    { regex: /lost\s+(aadhaar|pan|card|license|passport)/i, intent: "LOST_DOCUMENT", confidence: 0.95 },
    { regex: /stolen\s+bike/i, intent: "VEHICLE_THEFT", confidence: 0.95 },
    { regex: /bike\s+chori/i, intent: "VEHICLE_THEFT", confidence: 0.95 },
    { regex: /phone\s+(chori|stolen|lost)/i, intent: "LOST_MOBILE", confidence: 0.95 },
    { regex: /mobile\s+(chori|stolen|lost)/i, intent: "LOST_MOBILE", confidence: 0.95 }
  ];

  public classify(text: string): { intent: string; confidence: number; scenarioHints?: string[]; hintSource?: string[]; legacyIntent?: string } | null {
    for (const pattern of this.patterns) {
      if (pattern.regex.test(text)) {
        return {
          intent: pattern.intent,
          confidence: pattern.confidence,
          scenarioHints: this.adapter.adapt(pattern.intent),
          hintSource: ["PATTERN_CLASSIFIER"],
          legacyIntent: pattern.intent
        };
      }
    }
    return null;
  }
}
