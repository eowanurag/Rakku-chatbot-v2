import { RuleUnderstandingEngine } from '../../backend/src/chat/services/rule-understanding-engine';
import { ComplaintTypeClassifierService } from '../../backend/src/copilot/cie/services/complaint-type-classifier.service';
import { IncidentItemService } from '../../backend/src/copilot/cie/services/incident-item.service';

describe('Resilience - Rule Engine Only', () => {
  let ruleEngine: RuleUnderstandingEngine;

  beforeAll(() => {
    const classifier = new ComplaintTypeClassifierService();
    const itemService = new IncidentItemService();
    ruleEngine = new RuleUnderstandingEngine(classifier, itemService);
  });

  it('should deterministically extract container and complaint type from narrative', async () => {
    const result = await ruleEngine.understand("I lost my purse");
    
    expect(result).toBeDefined();
    expect(result.source).toBe("RULE_ONLY");
    expect(result.intent).toBe("LOST_MOBILE"); // Ambiguous lost item defaults to mobile/lost_item in rules classifier
    expect(result.containers.length).toBe(1);
    expect(result.containers[0].type).toBe("PURSE");
    expect(result.ambiguity).toBe(true);
  });

  it('should return MINIMUM_GUARANTEED for empty or invalid inputs', async () => {
    const result = await ruleEngine.understand("");
    
    expect(result).toBeDefined();
    expect(result.source).toBe("MINIMUM_GUARANTEED");
    expect(result.intent).toBe("UNKNOWN");
    expect(result.confidence).toBe("LOW");
  });
});
