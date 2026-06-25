import { IncidentItemService, IncidentItem } from '../../backend/src/copilot/cie/services/incident-item.service';
import { MAX_SESSION_JSON_SIZE } from '../../backend/src/copilot/workflow.config';

describe('Session Size Trim E2E Test', () => {
  let service: IncidentItemService;

  beforeAll(() => {
    service = new IncidentItemService();
  });

  it('should trim large session state to be under MAX_SESSION_JSON_SIZE (80KB)', () => {
    // Construct a huge session state with many log entries, amendments, etc.
    const longString = 'a'.repeat(2000); // 2KB description
    const incidentItems: IncidentItem[] = [];
    for (let i = 0; i < 50; i++) {
      incidentItems.push({
        itemId: `item_${i}`,
        itemCode: 'MOBILE_PHONE',
        quantity: 1,
        owner: 'SELF',
        attributes: {
          brand: 'Brand' + i,
          model: 'Model' + i,
          color: 'Black',
          serialNumber: 'SN' + i
        }
      });
    }

    const largeSessionState: any = {
      sessionId: 'test-large-session-id',
      workflow: 'complaint',
      step: 'REVIEW',
      data: {
        type: 'Lost Mobile / Theft',
        location: 'Station ' + longString,
        description: 'Pasted: ' + longString,
        incidentItems: incidentItems,
        amendments: Array.from({ length: 50 }, (_, i) => ({
          field: 'description',
          oldValue: 'old_' + i,
          newValue: 'new_' + i,
          timestamp: new Date().toISOString()
        })),
        assetsReview: {
          state: 'COMPLETED',
          partialItems: Array.from({ length: 50 }, (_, i) => ({
            text: 'partial ' + i,
            extracted: true
          }))
        }
      },
      debug: {
        logs: Array.from({ length: 100 }, (_, i) => `Log message number ${i}: ${longString}`)
      },
      intelligence: {
        recommendationReasoning: Array.from({ length: 50 }, (_, i) => ({
          token: 'BLOCK_SIM',
          reasons: ['MOBILE_PHONE']
        }))
      },
      telemetry: {
        clickEvents: Array.from({ length: 50 }, () => 'button_click')
      }
    };

    // The size of this session state before trimming should be very large
    const initialSize = JSON.stringify(largeSessionState).length;
    expect(initialSize).toBeGreaterThan(MAX_SESSION_JSON_SIZE);

    // Run trimSessionData
    service.trimSessionData(largeSessionState);

    // Verify it is trimmed below MAX_SESSION_JSON_SIZE
    const finalSize = JSON.stringify(largeSessionState).length;
    expect(finalSize).toBeLessThanOrEqual(MAX_SESSION_JSON_SIZE);
  });
});
