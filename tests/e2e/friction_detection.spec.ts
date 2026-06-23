import { WorkflowFrictionService } from '../../backend/src/copilot/workflow-completion/workflow-friction.service';

describe('Workflow Friction E2E/Service Spec', () => {
  let frictionService: WorkflowFrictionService;

  beforeAll(() => {
    frictionService = new WorkflowFrictionService();
  });

  it('should detect repeated edits and return risk score', () => {
    const res = frictionService.calculateFriction({ modificationsCount: 4 });
    expect(res.risk).toBe('MEDIUM');
    expect(res.frictionScore).toBeGreaterThan(0);
  });
});
