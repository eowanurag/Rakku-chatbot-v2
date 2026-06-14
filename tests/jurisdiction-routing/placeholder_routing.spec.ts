import { PoliceStationService } from '@backend/citizen-assistance/police-station.service';
import { JurisdictionService } from '@backend/jurisdiction-routing/jurisdiction.service';
import { RoutingTargetRegistryService } from '@backend/jurisdiction-routing/routing-target-registry.service';
import { PrismaService } from '@backend/prisma.service';

describe('Placeholder Routing UX Validation Spec', () => {
  jest.setTimeout(30000);
  let policeStationService: PoliceStationService;
  let targetRegistry: RoutingTargetRegistryService;
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();

    targetRegistry = new RoutingTargetRegistryService(prisma);
    await targetRegistry.seedAndLoadRegistry();

    const jurisdictionService = new JurisdictionService(
      new (require('@backend/jurisdiction-routing/location-resolver.service').LocationResolverService)(),
      new (require('@backend/jurisdiction-routing/jurisdiction.repository').JurisdictionRepository)(prisma),
      new (require('@backend/jurisdiction-routing/routing-policy.service').RoutingPolicyService)(),
      targetRegistry,
      prisma,
      new (require('@nestjs/event-emitter').EventEmitter2)()
    );

    policeStationService = new PoliceStationService(prisma, jurisdictionService, targetRegistry);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should format placeholder station response correctly, preventing coordinates, phone, maps exposure', async () => {
    // Amroha is a placeholder district station (seeded from stations.json as isPlaceholder: true)
    const result = await policeStationService.findByCity('Amroha');

    expect(result.success).toBe(true);
    expect(result.station.phone).toBeNull();
    expect(result.station.latitude).toBeNull();
    expect(result.station.longitude).toBeNull();
    expect(result.distanceKm).toBeNull();
    expect(result.mapsUrl).toBe('');
    expect(result.message).toContain('provisional routing configuration');
    expect(result.message).toContain('routed successfully');
  });

  it('should format verified station response with phone, coordinates, mapsUrl', async () => {
    // Lucknow is a verified district station (seeded as isPlaceholder: false or not set)
    const result = await policeStationService.findByCity('Lucknow');

    expect(result.success).toBe(true);
    expect(result.station.phone).not.toBeNull();
    expect(result.station.latitude).not.toBeNull();
    expect(result.station.longitude).not.toBeNull();
    expect(result.mapsUrl).toContain('google.com/maps');
    expect(result.message).toBeUndefined();
  });
});
