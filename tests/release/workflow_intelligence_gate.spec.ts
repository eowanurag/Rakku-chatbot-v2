import { WorkflowFrictionService } from '../../backend/src/copilot/workflow-completion/workflow-friction.service';
import { ProgressService } from '../../backend/src/copilot/workflow-completion/progress.service';

describe('Release Gate: Workflow Intelligence Spec', () => {
  let frictionService: WorkflowFrictionService;
  let progressService: ProgressService;

  beforeAll(() => {
    frictionService = new WorkflowFrictionService();
    progressService = new ProgressService();
  });

  it('should pass if friction risk evaluation is deterministic and valid', () => {
    const res = frictionService.calculateFriction({ modificationsCount: 5 });
    expect(res.risk).toBe('MEDIUM');
    expect(res.frictionScore).toBe(30);
  });

  it('should pass if progress evaluation is deterministic and valid', () => {
    const res = progressService.calculateProgress('lost_mobile', 'imei');
    expect(res.completionPercentage).toBeGreaterThanOrEqual(40);
    expect(res.remainingSteps).toBe(3);
  });
});
