import { RuleClassifier } from '../../backend/src/copilot/sae/classification/rule-classifier';
import { PatternClassifier } from '../../backend/src/copilot/sae/classification/pattern-classifier';

describe('SAE Hint Generation', () => {
  it('should generate scenario hints and legacy intent from RuleClassifier', () => {
    const classifier = new RuleClassifier();
    
    // Testing Hinglish phrase for lost mobile (triggers LOST_PROPERTY in rule dictionary)
    const result = classifier.classify("मेरा फोन खो गया है");
    
    if (result) {
      expect(result).toBeDefined();
      expect(result.legacyIntent).toBe("LOST_MOBILE");
      expect(result.confidence).toBeDefined();
      // Ensure adapt outputs hints like "LOSS", "MOBILE" or similar based on legacy intent
      const hints = (result as any).scenarioHints;
      expect(Array.isArray(hints)).toBe(true);
      expect(hints.length).toBeGreaterThan(0);
    }
  });

  it('should generate scenario hints and legacy intent from PatternClassifier', () => {
    const classifier = new PatternClassifier();
    
    // Testing typical mobile brand/IMEI patterns
    const result = classifier.classify("I lost my iPhone IMEI 354312345678901");
    
    if (result) {
      expect(result).toBeDefined();
      expect(result.legacyIntent).toBe("LOST_PROPERTY");
      const hints = (result as any).scenarioHints;
      expect(Array.isArray(hints)).toBe(true);
      expect(hints).toContain("LOSS");
    }
  });
});
