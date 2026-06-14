import { RoutingPolicyService } from '@backend/jurisdiction-routing/routing-policy.service';
import { RoutingTargetRegistryService } from '@backend/jurisdiction-routing/routing-target-registry.service';
import { JurisdictionSeedValidator } from '@backend/jurisdiction-routing/seed-validator';
import { PrismaService } from '@backend/prisma.service';

describe('RoutingPolicy and Registry Services Tests', () => {
  let policyService: RoutingPolicyService;
  let registryService: RoutingTargetRegistryService;
  let seedValidator: JurisdictionSeedValidator;
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    
    policyService = new RoutingPolicyService();
    policyService.onModuleInit();
    
    registryService = new RoutingTargetRegistryService(prisma);
    await registryService.seedAndLoadRegistry();

    seedValidator = new JurisdictionSeedValidator();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('gets correct routing target type for workflows', () => {
    expect(policyService.getTargetTypeForWorkflow('LOST_MOBILE')).toBe('POLICE_STATION');
    expect(policyService.getTargetTypeForWorkflow('CYBER_FRAUD')).toBe('CYBER_CELL');
    expect(policyService.getTargetTypeForWorkflow('CHARACTER_CERTIFICATE')).toBe('VERIFICATION_UNIT');
    expect(policyService.getTargetTypeForWorkflow('UNKNOWN')).toBe('POLICE_STATION');
  });

  it('verifies registry methods return stations', async () => {
    const lkoId = registryService.getStationIdByCode('UP-LKO-HAZ-001');
    expect(lkoId).toBeDefined();

    const valid = await registryService.validateTarget('POLICE_STATION', lkoId || 'invalid');
    expect(valid).toBe(true);
  });

  it('validates the seed datasets', () => {
    expect(() => seedValidator.onModuleInit()).not.toThrow();
    expect(seedValidator.getDatasetPath()).toBeDefined();
  });
});
