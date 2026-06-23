import { ConsensusEngineService } from '../../backend/src/copilot/consensus/consensus-engine.service';

jest.setTimeout(30000);

describe('Consensus Engine Confidence Bands', () => {
  let service: ConsensusEngineService;

  beforeAll(() => {
    service = new ConsensusEngineService();
  });

  it('should map confidence scores correctly', () => {
    const cueResult = { intent: 'COMPLAINT', confidence: 0.96 };
    const saeResult = { urgency: 'LOW', requiresClarification: false, confidence: 0.96 };
    
    const result = service.getConsensus(cueResult, null, saeResult, [], null);
    expect(result.confidenceScore).toBe('VERY_HIGH');
  });
});
