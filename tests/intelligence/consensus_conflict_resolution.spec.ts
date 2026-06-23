import { ConsensusEngineService } from '../../backend/src/copilot/consensus/consensus-engine.service';

jest.setTimeout(30000);

describe('Consensus Engine Conflict Resolution', () => {
  let service: ConsensusEngineService;

  beforeAll(() => {
    service = new ConsensusEngineService();
  });

  it('should flag clarification required when CIE says Complaint and SAE says Emergency', () => {
    const cueResult = { intent: 'COMPLAINT', confidence: 0.9 };
    const cieResult = { complaintReadinessScore: 0.8 };
    const saeResult = { urgency: 'CRITICAL', requiresClarification: false, riskCategory: 'ACCIDENT' };
    const sreResult = ['File Complaint'];
    const dbCieResult = null;

    const result = service.getConsensus(cueResult, cieResult, saeResult, sreResult, dbCieResult);
    expect(result.clarificationRequired).toBe(true);
  });
});
