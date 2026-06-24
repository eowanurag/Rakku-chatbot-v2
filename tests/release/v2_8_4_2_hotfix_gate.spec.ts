import { ComplaintTypeClassifierService } from '@backend/copilot/cie/services/complaint-type-classifier.service';
import { isSystemAction } from '@backend/chat/utils/citizen-input.util';
import { validateIncidentDate } from '@backend/chat/utils/validateIncidentDate';

describe('Release Gate V2.8.4.2 Hotfix Gate Spec', () => {
  it('should assert all hotfix requirements are properly implemented and integrated', () => {
    // 1. Classifier test
    const classifier = new ComplaintTypeClassifierService();
    const classification = classifier.classify('I lost my purse');
    expect(classification.matches).toContain('Lost Document');
    expect(classification.confidence).toBe('HIGH');

    // 2. Multi-match test
    const multiMatch = classifier.classify('I lost my purse and phone');
    expect(multiMatch.matches.length).toBeGreaterThan(1);
    expect(multiMatch.matches).toContain('Lost Document');
    expect(multiMatch.matches).toContain('Lost Mobile / Theft');

    // 3. System actions check
    expect(isSystemAction('Modify Details', 'REVIEW')).toBe(true);
    expect(isSystemAction('Cancel', 'REVIEW')).toBe(true);
    expect(isSystemAction('He asked me to cancel my complaint', '5')).toBe(false);

    // 4. Date validation
    expect(validateIncidentDate('31/02/2026')).toBe(false);
    expect(validateIncidentDate('today')).toBe(true);
    expect(validateIncidentDate('yesterday')).toBe(true);
    expect(validateIncidentDate('tomorrow')).toBe(false);

    console.log('__RAKKU_V2_8_4_2_REAL_WORLD_WORKFLOW_HARDENING_COMPLETE__');
  });
});
