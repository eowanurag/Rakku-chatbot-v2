import { ProgressService } from '../../backend/src/copilot/workflow-completion/progress.service';

describe('Workflow Progress Intelligence Spec', () => {
  let progressService: ProgressService;

  beforeAll(() => {
    progressService = new ProgressService();
  });

  it('should calculate progress for Lost Mobile workflow correctly', () => {
    // steps: ['start', 'brand', 'model', 'imei', 'location', 'details', 'review']
    const startProgress = progressService.calculateProgress('lost_mobile', 'start');
    expect(startProgress.completionPercentage).toBe(0);
    expect(startProgress.remainingSteps).toBe(6);

    const modelProgress = progressService.calculateProgress('lost_mobile', 'model');
    expect(modelProgress.completionPercentage).toBe(33);
    expect(modelProgress.remainingSteps).toBe(4);

    const reviewProgress = progressService.calculateProgress('lost_mobile', 'review');
    expect(reviewProgress.completionPercentage).toBe(100);
    expect(reviewProgress.remainingSteps).toBe(0);
  });

  it('should calculate progress for Cyber Fraud workflow correctly', () => {
    // steps: ['start', 'transaction', 'bank', 'amount', 'details', 'review']
    const amountProgress = progressService.calculateProgress('cyber_fraud', 'amount');
    expect(amountProgress.completionPercentage).toBe(60);
    expect(amountProgress.remainingSteps).toBe(2);
    expect(amountProgress.estimatedTimeText).toBe('1 minute');
  });

  it('should return correct prompt text', () => {
    const promptText = progressService.getPrompt('lost_mobile', 'location');
    expect(promptText).toContain('You have completed');
    expect(promptText).toContain('steps remain');
  });
});
