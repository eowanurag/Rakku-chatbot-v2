import { ProgressService } from '../../backend/src/copilot/workflow-completion/progress.service';

describe('Workflow Progress E2E/Service Spec', () => {
  let progressService: ProgressService;

  beforeAll(() => {
    progressService = new ProgressService();
  });

  it('should verify progress percentage formats correctly', () => {
    const res = progressService.calculateProgress('lost_mobile', 'brand');
    expect(res.completionPercentage).toBeGreaterThanOrEqual(0);
    expect(res.completionPercentage).toBeLessThanOrEqual(100);
    expect(res.remainingSteps).toBe(5);

    const promptText = progressService.getPrompt('lost_mobile', 'brand');
    expect(promptText).toContain('You have completed');
  });
});
