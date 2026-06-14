import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma.service';
import { JurisdictionSeedValidator } from './seed-validator';
import { LocationResolverService } from './location-resolver.service';
import { RoutingTargetRegistryService } from './routing-target-registry.service';
import { RoutingPolicyService } from './routing-policy.service';
import { JurisdictionRepository } from './jurisdiction.repository';
import { JurisdictionService } from './jurisdiction.service';
import { JurisdictionLifecycleService } from './jurisdiction-lifecycle.service';
import { JurisdictionAnalyticsService } from './jurisdiction-analytics.service';
import { JurisdictionRoutingController } from './jurisdiction-routing.controller';

@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [JurisdictionRoutingController],
  providers: [
    PrismaService,
    JurisdictionSeedValidator,
    LocationResolverService,
    RoutingTargetRegistryService,
    RoutingPolicyService,
    JurisdictionRepository,
    JurisdictionService,
    JurisdictionLifecycleService,
    JurisdictionAnalyticsService,
  ],
  exports: [
    JurisdictionSeedValidator,
    LocationResolverService,
    RoutingTargetRegistryService,
    RoutingPolicyService,
    JurisdictionRepository,
    JurisdictionService,
    JurisdictionLifecycleService,
    JurisdictionAnalyticsService,
  ],
})
export class JurisdictionRoutingModule {}
