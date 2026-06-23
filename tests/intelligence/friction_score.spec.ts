import { WorkflowFrictionService } from '../../backend/src/copilot/workflow-completion/workflow-friction.service';

describe('Workflow Friction Intelligence Spec', () => {
  let frictionService: WorkflowFrictionService;

  beforeAll(() => {
    frictionService = new WorkflowFrictionService();
  });

  it('should return LOW risk when there is no friction', () => {
    const res = frictionService.calculateFriction({});
    expect(res.frictionScore).toBe(0);
    expect(res.risk).toBe('LOW');
    expect(res.reasons[0]).toContain('No significant friction detected');
  });

  it('should detect repeated edits and elevate frictionScore and risk', () => {
    const res = frictionService.calculateFriction({ modificationsCount: 3 });
    expect(res.frictionScore).toBe(30);
    expect(res.risk).toBe('MEDIUM');
    expect(res.reasons[0]).toContain('Repeated edits detected');
  });

  it('should detect repeated clarifications and elevate frictionScore and risk', () => {
    const res = frictionService.calculateFriction({ backActionsCount: 3 });
    expect(res.frictionScore).toBe(25);
    expect(res.risk).toBe('LOW');
    expect(res.reasons[0]).toContain('Repeated clarifications or step backs detected');
  });

  it('should detect question retries/validation failures and elevate frictionScore and risk', () => {
    const res = frictionService.calculateFriction({ validationFailuresCount: 3 });
    expect(res.frictionScore).toBe(25);
    expect(res.risk).toBe('LOW');
    expect(res.reasons[0]).toContain('Question retries or validation failures detected');
  });

  it('should detect idle sessions above 15 minutes', () => {
    const pastDate = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
    const res = frictionService.calculateFriction({ lastActivityAt: pastDate });
    expect(res.frictionScore).toBe(20);
    expect(res.risk).toBe('LOW');
    expect(res.reasons[0]).toContain('Idle session detected');
  });

  it('should aggregate multiple friction points to HIGH risk', () => {
    const res = frictionService.calculateFriction({
      modificationsCount: 3,
      backActionsCount: 3,
      validationFailuresCount: 3
    });
    expect(res.frictionScore).toBe(80);
    expect(res.risk).toBe('HIGH');
    expect(res.reasons).toHaveLength(3);
  });
});
