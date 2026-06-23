import { ComplaintSummaryService } from '../../backend/src/copilot/cie/services/complaint-summary.service';

describe('Officer Summary E2E Spec', () => {
  let service: ComplaintSummaryService;

  beforeAll(() => {
    service = new ComplaintSummaryService();
  });

  it('should generate a formatted handoff package correctly', () => {
    const citizen = { fullName: 'Ramesh Sharma', mobileNumber: '9988776655', email: 'ramesh@email.com', city: 'Lucknow', district: 'LUCKNOW' };
    const complaint = { complaintType: 'LOST_MOBILE', incidentDetails: 'My phone was stolen', status: 'Submitted', createdAt: new Date().toISOString() };
    const entities = { imei: '123456789012345', mobilemodel: 'iPhone 14' };
    const riskLevel = 'MEDIUM';
    const recs = ['Block SIM', 'Track Complaint'];

    const pkg = service.generateHandoffPackage(citizen, complaint, entities, riskLevel, [], recs);
    expect(pkg.citizenDetails).toContain('Ramesh Sharma');
    expect(pkg.citizenDetails).toContain('9988776655');
    expect(pkg.incidentSummary).toContain('LOST_MOBILE');
    expect(pkg.keyFacts).toContain('imei: 123456789012345');
    expect(pkg.riskIndicators).toContain('MEDIUM');
    expect(pkg.recommendations).toContain('Block SIM');
    expect(pkg.rawText).toContain('=== OFFICER HANDOFF PACKAGE ===');
  });
});
