import { ConflictResolver } from '../../backend/src/chat/services/conflict-resolver';
import { UnderstandingResult } from '../../backend/src/copilot/cie/dto/understanding-result.dto';

describe('Resilience - Conflict Resolver', () => {
  let conflictResolver: ConflictResolver;

  beforeAll(() => {
    conflictResolver = new ConflictResolver();
  });

  it('should override conflicting AI complaintType and intent if Rule confidence is HIGH', () => {
    const ruleResult: UnderstandingResult = {
      version: 1,
      language: 'en',
      intent: 'LOST_MOBILE',
      complaintType: 'Lost Mobile / Theft',
      entities: [],
      incidentItems: [],
      containers: [],
      confidence: 'HIGH',
      ambiguity: false,
      source: 'RULE_ONLY'
    };

    const aiResult: UnderstandingResult = {
      version: 1,
      language: 'en',
      intent: 'LOST_DOCUMENT',
      complaintType: 'Lost Document',
      entities: [],
      incidentItems: [],
      containers: [],
      confidence: 'HIGH',
      ambiguity: false,
      source: 'RULE_PLUS_AI'
    };

    const resolved = conflictResolver.resolveConflicts(ruleResult, aiResult);

    expect(resolved.complaintType).toBe('Lost Mobile / Theft');
    expect(resolved.intent).toBe('LOST_MOBILE');
  });

  it('should override conflicting AI containers if Rule confidence is HIGH', () => {
    const ruleResult: UnderstandingResult = {
      version: 1,
      language: 'en',
      intent: 'LOST_MOBILE',
      entities: [],
      incidentItems: [],
      containers: [{ containerId: 'c1', type: 'PURSE', status: 'LOST', owner: 'SELF' }],
      confidence: 'HIGH',
      ambiguity: false,
      source: 'RULE_ONLY'
    };

    const aiResult: UnderstandingResult = {
      version: 1,
      language: 'en',
      intent: 'LOST_MOBILE',
      entities: [],
      incidentItems: [],
      containers: [{ containerId: 'c2', type: 'BAG', status: 'LOST', owner: 'SELF' }],
      confidence: 'HIGH',
      ambiguity: false,
      source: 'RULE_PLUS_AI'
    };

    const resolved = conflictResolver.resolveConflicts(ruleResult, aiResult);

    expect(resolved.containers.length).toBe(1);
    expect(resolved.containers[0].type).toBe('PURSE');
  });
});
