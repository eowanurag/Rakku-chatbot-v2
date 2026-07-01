import { UnderstandingMerger } from '../../backend/src/chat/services/understanding-merger';
import { UnderstandingResult } from '../../backend/src/copilot/cie/dto/understanding-result.dto';

describe('Resilience - Understanding Merge Precedence', () => {
  let merger: UnderstandingMerger;

  beforeAll(() => {
    merger = new UnderstandingMerger();
  });

  it('should prefer high-confidence deterministic rules over AI contradictions', () => {
    const ruleResult: UnderstandingResult = {
      version: 1,
      language: 'en',
      intent: 'LOST_MOBILE',
      complaintType: 'Lost Mobile / Theft',
      entities: [
        { name: 'container', value: 'PURSE', confidence: 'HIGH', origin: 'RULE' },
        { name: 'complaintType', value: 'Lost Mobile / Theft', confidence: 'HIGH', origin: 'RULE' }
      ],
      incidentItems: [],
      containers: [{ containerId: 'container_001', type: 'PURSE', status: 'LOST', owner: 'SELF' }],
      confidence: 'HIGH',
      ambiguity: true,
      source: 'RULE_ONLY'
    };

    const aiResult: UnderstandingResult = {
      version: 1,
      language: 'en',
      intent: 'LOST_MOBILE',
      complaintType: 'Lost Document',
      entities: [
        { name: 'container', value: 'BAG', confidence: 'HIGH', origin: 'AI' },
        { name: 'complaintType', value: 'Lost Document', confidence: 'HIGH', origin: 'AI' }
      ],
      incidentItems: [],
      containers: [{ containerId: 'container_001', type: 'BAG', status: 'LOST', owner: 'SELF' }],
      confidence: 'HIGH',
      ambiguity: false,
      source: 'RULE_PLUS_AI'
    };

    const merged = merger.mergeUnderstanding(ruleResult, aiResult);

    expect(merged.source).toBe('MERGED');
    // Rule says PURSE, AI says BAG. Rule should win because it is origin RULE with HIGH confidence.
    const containerEnt = merged.entities.find(e => e.name === 'container');
    expect(containerEnt?.value).toBe('PURSE');
    expect(merged.containers[0].type).toBe('PURSE');
    
    // Rule says Lost Mobile / Theft, AI says Lost Document. Rule wins.
    expect(merged.complaintType).toBe('Lost Mobile / Theft');
  });

  it('should allow AI to enrich missing or low-confidence details', () => {
    const ruleResult: UnderstandingResult = {
      version: 1,
      language: 'en',
      intent: 'UNKNOWN',
      entities: [],
      incidentItems: [],
      containers: [],
      confidence: 'LOW',
      ambiguity: true,
      source: 'RULE_ONLY'
    };

    const aiResult: UnderstandingResult = {
      version: 1,
      language: 'en',
      intent: 'LOST_MOBILE',
      complaintType: 'Lost Mobile / Theft',
      entities: [
        { name: 'deviceDetails', value: 'iPhone', confidence: 'HIGH', origin: 'AI' }
      ],
      incidentItems: [{ itemId: 'item_001', itemCode: 'MOBILE_PHONE', status: 'LOST', confirmed: false }],
      containers: [],
      confidence: 'HIGH',
      ambiguity: false,
      source: 'RULE_PLUS_AI'
    };

    const merged = merger.mergeUnderstanding(ruleResult, aiResult);

    expect(merged.intent).toBe('LOST_MOBILE');
    expect(merged.complaintType).toBe('Lost Mobile / Theft');
    expect(merged.incidentItems.length).toBe(1);
    expect(merged.entities.find(e => e.name === 'deviceDetails')?.value).toBe('iPhone');
  });
});
