import { JurisdictionRepository } from '@backend/jurisdiction-routing/jurisdiction.repository';
import { PrismaService } from '@backend/prisma.service';
import {
  RoutingTargetType,
  ResolutionSource,
  MatchType,
  RoutingDecision,
  ResolutionStatus,
  ActorType,
} from '@backend/jurisdiction-routing/jurisdiction-routing.types';

describe('JurisdictionRepository Tests', () => {
  let repository: JurisdictionRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    repository = new JurisdictionRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('performs create, read, update operations on jurisdiction resolution aggregate root', async () => {
    const res = await repository.createResolution({
      routingTargetType: RoutingTargetType.POLICE_STATION,
      routingTargetId: 'test-target',
      serviceType: 'LOST_MOBILE',
      routingContext: 'INCIDENT_LOCATION',
      sourceLocation: { address: 'Ayodhya' },
      resolutionSource: ResolutionSource.TEXT_INPUT,
      confidence: 1.0,
      matchType: MatchType.EXACT,
      routingDecision: RoutingDecision.AUTO_ASSIGNED,
      status: ResolutionStatus.PENDING,
      jurisdictionVersion: '2026.01',
    });

    expect(res.id).toBeDefined();
    expect(res.status).toBe(ResolutionStatus.PENDING);

    const fetched = await repository.getResolution(res.id);
    expect(fetched).toBeDefined();
    expect(fetched?.id).toBe(res.id);

    const updated = await repository.updateResolution(res.id, {
      status: ResolutionStatus.CONFIRMED,
      routingDecision: RoutingDecision.USER_CONFIRMED,
    });
    expect(updated.status).toBe(ResolutionStatus.CONFIRMED);
    expect(updated.routingDecision).toBe(RoutingDecision.USER_CONFIRMED);

    // Clean up
    await prisma.jurisdictionResolutionHistory.deleteMany({ where: { jurisdictionResolutionId: res.id } });
    await prisma.jurisdictionResolutionEvent.deleteMany({ where: { jurisdictionResolutionId: res.id } });
    await prisma.jurisdictionResolution.delete({ where: { id: res.id } });
  });

  it('creates history and event records', async () => {
    const res = await repository.createResolution({
      routingTargetType: RoutingTargetType.POLICE_STATION,
      routingTargetId: 'test-target',
      serviceType: 'LOST_MOBILE',
      routingContext: 'INCIDENT_LOCATION',
      sourceLocation: { address: 'Ayodhya' },
      resolutionSource: ResolutionSource.TEXT_INPUT,
      confidence: 1.0,
      matchType: MatchType.EXACT,
      routingDecision: RoutingDecision.AUTO_ASSIGNED,
      status: ResolutionStatus.PENDING,
      jurisdictionVersion: '2026.01',
    });

    const hist = await repository.createHistory({
      jurisdictionResolutionId: res.id,
      previousStatus: ResolutionStatus.PENDING,
      newStatus: ResolutionStatus.CONFIRMED,
      reason: 'Test history',
      actorType: ActorType.SYSTEM,
    });
    expect(hist.id).toBeDefined();

    const evt = await repository.createEvent({
      jurisdictionResolutionId: res.id,
      eventType: 'TEST_EVENT',
      actorType: ActorType.CITIZEN,
      metadata: { debug: true },
    });
    expect(evt.id).toBeDefined();

    // Clean up
    await prisma.jurisdictionResolutionHistory.deleteMany({ where: { jurisdictionResolutionId: res.id } });
    await prisma.jurisdictionResolutionEvent.deleteMany({ where: { jurisdictionResolutionId: res.id } });
    await prisma.jurisdictionResolution.delete({ where: { id: res.id } });
  });
});
