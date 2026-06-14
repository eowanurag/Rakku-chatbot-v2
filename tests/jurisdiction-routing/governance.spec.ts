import { JurisdictionRoutingController } from '@backend/jurisdiction-routing/jurisdiction-routing.controller';
import { JurisdictionAnalyticsService } from '@backend/jurisdiction-routing/jurisdiction-analytics.service';
import { JurisdictionSeedValidator } from '@backend/jurisdiction-routing/seed-validator';
import { JurisdictionLifecycleService } from '@backend/jurisdiction-routing/jurisdiction-lifecycle.service';
import { JurisdictionService } from '@backend/jurisdiction-routing/jurisdiction.service';
import { LocationResolverService } from '@backend/jurisdiction-routing/location-resolver.service';
import { JurisdictionRepository } from '@backend/jurisdiction-routing/jurisdiction.repository';
import { RoutingPolicyService } from '@backend/jurisdiction-routing/routing-policy.service';
import { RoutingTargetRegistryService } from '@backend/jurisdiction-routing/routing-target-registry.service';
import { PrismaService } from '@backend/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ResolutionSource } from '@backend/jurisdiction-routing/jurisdiction-routing.types';

describe('Jurisdiction Platform Governance & Analytics Tests', () => {
  let controller: JurisdictionRoutingController;
  let analyticsService: JurisdictionAnalyticsService;
  let seedValidator: JurisdictionSeedValidator;
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    const eventEmitter = new EventEmitter2();
    const repository = new JurisdictionRepository(prisma);
    const service = new JurisdictionService(
      new LocationResolverService(),
      repository,
      new RoutingPolicyService(),
      new RoutingTargetRegistryService(prisma),
      prisma,
      eventEmitter
    );
    const lifecycle = new JurisdictionLifecycleService(repository, eventEmitter);
    analyticsService = new JurisdictionAnalyticsService(prisma);
    seedValidator = new JurisdictionSeedValidator(prisma);
    
    controller = new JurisdictionRoutingController(
      service,
      lifecycle,
      analyticsService,
      repository
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('runs analytics metrics queries successfully', async () => {
    const report1 = await analyticsService.getRoutingDecisionMetrics();
    const report2 = await analyticsService.getResolutionSourceMetrics();
    const report3 = await analyticsService.getOverrideMetrics();
    expect(report1).toBeDefined();
    expect(report2).toBeDefined();
    expect(report3).toBeDefined();
  });

  it('calls controller endpoints directly', async () => {
    const analytics = await controller.getAnalytics();
    expect(analytics.routingDecisions).toBeDefined();

    // Test resolve endpoint
    const res = await controller.resolveJurisdiction({
      serviceType: 'LOST_MOBILE',
      routingContext: 'INCIDENT_LOCATION',
      location: 'Ayodhya',
      resolutionSource: ResolutionSource.TEXT_INPUT,
    });
    expect(res.id).toBeDefined();

    const hist = await controller.getResolutionHistory(res.id);
    expect(Array.isArray(hist)).toBe(true);

    // Clean up
    await prisma.jurisdictionResolutionHistory.deleteMany({ where: { jurisdictionResolutionId: res.id } });
    await prisma.jurisdictionResolutionEvent.deleteMany({ where: { jurisdictionResolutionId: res.id } });
    await prisma.jurisdictionResolution.delete({ where: { id: res.id } });
  });
});
