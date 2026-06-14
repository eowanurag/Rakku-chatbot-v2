import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LocationResolverService } from './location-resolver.service';
import { JurisdictionRepository } from './jurisdiction.repository';
import { RoutingPolicyService } from './routing-policy.service';
import { RoutingTargetRegistryService } from './routing-target-registry.service';
import { PrismaService } from '../prisma.service';
import {
  LocationResolutionInput,
  ResolutionStatus,
  RoutingDecision,
  MatchType,
  ResolutionSource,
  ResolutionEventType,
} from './jurisdiction-routing.types';

@Injectable()
export class JurisdictionService {
  private readonly logger = new Logger(JurisdictionService.name);

  constructor(
    private readonly locationResolver: LocationResolverService,
    private readonly repository: JurisdictionRepository,
    private readonly policyService: RoutingPolicyService,
    private readonly targetRegistry: RoutingTargetRegistryService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async resolveJurisdiction(params: LocationResolutionInput) {
    this.logger.log(`Resolving jurisdiction for ${params.serviceType} / context: ${params.routingContext}`);

    // Load active version
    const versionRecord = await this.prisma.jurisdictionRegistryVersion.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    const version = versionRecord ? versionRecord.version : '2026.01';

    // 1. Resolve Location Coordinates if GPS available
    let resolvedStationId: string | undefined = undefined;
    let confidence = 1.0;
    let matchType = MatchType.EXACT;
    let decision = RoutingDecision.AUTO_ASSIGNED;
    let resolvedLocalityCode: string | undefined = undefined;
    let resolvedCityCode: string | undefined = undefined;
    let resolvedDistrictCode = 'LUCKNOW';

    if (params.coordinates && params.resolutionSource === ResolutionSource.GPS) {
      // Find nearest station by coordinates
      const stations = await this.prisma.policeStation.findMany({ where: { isActive: true } });
      if (stations.length > 0) {
        let nearest = stations[0];
        let minDistance = Infinity;
        for (const s of stations) {
          if (s.latitude && s.longitude) {
            const dist = this.calculateDistance(params.coordinates.lat, params.coordinates.lng, s.latitude, s.longitude);
            if (dist < minDistance) {
              minDistance = dist;
              nearest = s;
            }
          }
        }
        resolvedStationId = nearest.id;
        resolvedDistrictCode = nearest.districtCode;
        resolvedCityCode = nearest.cityCode || undefined;
        resolvedLocalityCode = nearest.localityCode || undefined;
        matchType = MatchType.EXACT;
        confidence = 1.0;
        decision = RoutingDecision.AUTO_ASSIGNED;
      }
    } else {
      // Text resolution
      const resolution = this.locationResolver.resolve(params.location);
      resolvedDistrictCode = resolution.districtCode;
      resolvedCityCode = resolution.cityCode;
      resolvedLocalityCode = resolution.localityCode;
      confidence = resolution.confidence;
      matchType = resolution.matchType;

      // Match station via JurisdictionMapping
      let mapping = await this.prisma.jurisdictionMapping.findFirst({
        where: {
          districtCode: resolvedDistrictCode,
          cityCode: resolvedCityCode || null,
          localityCode: resolvedLocalityCode || null,
        },
        orderBy: { priority: 'asc' },
      });

      if (!mapping && resolvedDistrictCode) {
        // Fallback to district matching
        mapping = await this.prisma.jurisdictionMapping.findFirst({
          where: { districtCode: resolvedDistrictCode },
          orderBy: { priority: 'asc' },
        });
      }

      if (mapping) {
        resolvedStationId = mapping.policeStationId;
        decision = confidence >= 0.80 ? RoutingDecision.AUTO_ASSIGNED : RoutingDecision.FALLBACK_ASSIGNED;
      } else {
        // Fallback to a default station (e.g. Kotwali/Hazratganj)
        const defaultStation = await this.prisma.policeStation.findFirst({
          where: { districtCode: 'LUCKNOW' },
        });
        resolvedStationId = defaultStation?.id;
        decision = RoutingDecision.FALLBACK_ASSIGNED;
        matchType = MatchType.NONE;
        confidence = 0.5;
      }
    }

    const targetType = this.policyService.getTargetTypeForWorkflow(params.serviceType);

    // Create the JurisdictionResolution entity in PENDING state
    const resolutionEntity = await this.repository.createResolution({
      routingTargetType: targetType,
      routingTargetId: resolvedStationId || '',
      policeStationId: resolvedStationId,
      serviceType: params.serviceType,
      routingContext: params.routingContext,
      sourceLocation: {
        location: params.location,
        coordinates: params.coordinates || null,
      },
      resolutionSource: params.resolutionSource,
      confidence,
      matchType,
      routingDecision: decision,
      status: ResolutionStatus.PENDING,
      jurisdictionVersion: version,
    });

    // Create initial history record
    await this.repository.createHistory({
      jurisdictionResolutionId: resolutionEntity.id,
      newStatus: ResolutionStatus.PENDING,
      newStationId: resolvedStationId,
      newTargetType: targetType,
      newTargetId: resolvedStationId,
      reason: 'Initial resolution created',
    });

    // Create business event
    await this.repository.createEvent({
      jurisdictionResolutionId: resolutionEntity.id,
      eventType: ResolutionEventType.RESOLUTION_CREATED,
      metadata: {
        source: params.resolutionSource,
        confidence,
        decision,
      },
    });

    // Emit lightweight NestJS internal domain event
    this.eventEmitter.emit('ResolutionCreated', resolutionEntity);

    return resolutionEntity;
  }
}
