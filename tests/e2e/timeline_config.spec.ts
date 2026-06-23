import { TimelineGeneratorService } from '@backend/copilot/cie/services/timeline-generator.service';

describe('Workflow Timeline Config Spec', () => {
  let timelineGeneratorService: TimelineGeneratorService;

  beforeAll(() => {
    timelineGeneratorService = new TimelineGeneratorService();
  });

  it('should load timeline configuration and generate display text for complaint', () => {
    const config = timelineGeneratorService.getTimeline('complaint');
    expect(config).toBeDefined();
    expect(config?.workflowType).toBe('complaint');
    expect(config?.stages.length).toBe(4);
    expect(config?.stages[0].stageId).toBe('SUBMITTED');

    const display = timelineGeneratorService.generateTimelineDisplay('complaint');
    expect(display).toContain('Expected Timeline for COMPLAINT');
    expect(display).toContain('Complaint Registered');
    expect(display).toContain('Assigned to Officer');
    expect(display).toContain('Estimated Total Processing Time:');
  });

  it('should load timeline configuration and generate display text for verification', () => {
    const config = timelineGeneratorService.getTimeline('verification');
    expect(config).toBeDefined();
    expect(config?.workflowType).toBe('verification');
    expect(config?.stages.length).toBe(4);
    expect(config?.stages[1].stageId).toBe('SCHEDULED');

    const display = timelineGeneratorService.generateTimelineDisplay('verification');
    expect(display).toContain('Expected Timeline for VERIFICATION');
    expect(display).toContain('Field Visit Scheduled');
  });

  it('should return null for unregistered workflows', () => {
    const config = timelineGeneratorService.getTimeline('non_existent_workflow');
    expect(config).toBeNull();

    const display = timelineGeneratorService.generateTimelineDisplay('non_existent_workflow');
    expect(display).toBe('');
  });
});
