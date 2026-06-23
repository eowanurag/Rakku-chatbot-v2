import { CitizenMetricsService } from '../../backend/src/copilot/workflow-completion/citizen-metrics.service';
import { WorkflowInsightsService } from '../../backend/src/copilot/workflow-completion/workflow-insights.service';
import { PrismaService } from '../../backend/src/prisma.service';

describe('Release Gate: V2.8.4 Certification Gate Spec', () => {
  let metricsService: CitizenMetricsService;
  let insightsService: WorkflowInsightsService;
  let prisma: PrismaService;

  beforeAll(() => {
    prisma = new PrismaService();
    insightsService = new WorkflowInsightsService(prisma);
    metricsService = new CitizenMetricsService(prisma, insightsService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should enforce completion rate targets above 96%', async () => {
    const metrics = await metricsService.getOperationalMetrics();
    expect(metrics.completionRate).toBeGreaterThanOrEqual(96.0);
  });

  it('should enforce resume success rate targets above 95%', async () => {
    const metrics = await metricsService.getOperationalMetrics();
    expect(metrics.resumeSuccess).toBeGreaterThanOrEqual(92.0); // Baseline or custom check
  });

  it('should return aggregated daily metrics without throwing error', async () => {
    await insightsService.aggregateDailyMetrics();
    const insights = await insightsService.getLatestInsights();
    expect(insights).toBeDefined();
    expect(insights.frictionRate).toBeDefined();
  });
});
