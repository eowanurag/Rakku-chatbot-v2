import { JurisdictionLifecycleService } from '@backend/jurisdiction-routing/jurisdiction-lifecycle.service';
import { JurisdictionService } from '@backend/jurisdiction-routing/jurisdiction.service';
import { LocationResolverService } from '@backend/jurisdiction-routing/location-resolver.service';
import { JurisdictionRepository } from '@backend/jurisdiction-routing/jurisdiction.repository';
import { RoutingPolicyService } from '@backend/jurisdiction-routing/routing-policy.service';
import { RoutingTargetRegistryService } from '@backend/jurisdiction-routing/routing-target-registry.service';
import { PrismaService } from '@backend/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ResolutionSource,
  RoutingDecision,
  ResolutionStatus,
  ActorType,
} from '@backend/jurisdiction-routing/jurisdiction-routing.types';

describe('JurisdictionLifecycleService Tests', () => {
  let lifecycleService: JurisdictionLifecycleService;
  let service: JurisdictionService;
  let repository: JurisdictionRepository;
  let prisma: PrismaService;
  let eventEmitter: EventEmitter2;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    eventEmitter = new EventEmitter2();
    repository = new JurisdictionRepository(prisma);
    lifecycleService = new JurisdictionLifecycleService(repository, eventEmitter);
    service = new JurisdictionService(
      new LocationResolverService(),
      repository,
      new RoutingPolicyService(),
      new RoutingTargetRegistryService(prisma),
      prisma,
      eventEmitter
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('runs complete lifecycle: pending -> confirmed -> overridden', async () => {
    const res = await service.resolveJurisdiction({
      serviceType: 'LOST_MOBILE',
      routingContext: 'INCIDENT_LOCATION',
      location: 'Ayodhya',
      resolutionSource: ResolutionSource.TEXT_INPUT,
    });

    expect(res.status).toBe(ResolutionStatus.PENDING);

    // Confirm resolution
    const confirmed = await lifecycleService.confirmResolution(
      res.id,
      'USER_CONFIRMED',
      ActorType.CITIZEN
    );
    expect(confirmed.status).toBe(ResolutionStatus.CONFIRMED);
    expect(confirmed.routingDecision).toBe(RoutingDecision.USER_CONFIRMED);

    // GPS coordinate resolution test
    const gpsRes = await service.resolveJurisdiction({
      serviceType: 'LOST_MOBILE',
      routingContext: 'INCIDENT_LOCATION',
      location: 'GPS',
      resolutionSource: ResolutionSource.GPS,
      coordinates: { lat: 26.8467, lng: 80.9462 },
    });
    expect(gpsRes.policeStationId).toBeDefined();
    
    // Cleanup GPS Resolution
    await prisma.jurisdictionResolutionHistory.deleteMany({ where: { jurisdictionResolutionId: gpsRes.id } });
    await prisma.jurisdictionResolutionEvent.deleteMany({ where: { jurisdictionResolutionId: gpsRes.id } });
    await prisma.jurisdictionResolution.delete({ where: { id: gpsRes.id } });

    // Fetch some station for override
    const station = await prisma.policeStation.findFirst();
    if (station) {
      const overridden = await lifecycleService.overrideResolution(
        res.id,
        station.id,
        'Changed for verification',
        ActorType.OFFICER
      );
      expect(overridden.status).toBe(ResolutionStatus.OVERRIDDEN);
      expect(overridden.policeStationId).toBe(station.id);
    }

    // Cleanup
    await prisma.jurisdictionResolutionHistory.deleteMany({ where: { jurisdictionResolutionId: res.id } });
    await prisma.jurisdictionResolutionEvent.deleteMany({ where: { jurisdictionResolutionId: res.id } });
    await prisma.jurisdictionResolution.delete({ where: { id: res.id } });
  });

  it('throws error when confirming already confirmed or invalid resolution', async () => {
    await expect(lifecycleService.confirmResolution('invalid-id', 'USER_CONFIRMED'))
      .rejects.toThrow();
  });
});
