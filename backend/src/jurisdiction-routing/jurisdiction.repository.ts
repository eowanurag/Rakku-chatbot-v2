import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  ResolutionStatus,
  RoutingTargetType,
  RoutingDecision,
  MatchType,
  ResolutionSource,
  ActorType,
  ResolutionEventType,
  RoutingContext,
} from './jurisdiction-routing.types';

@Injectable()
export class JurisdictionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createResolution(data: {
    routingTargetType: RoutingTargetType;
    routingTargetId: string;
    policeStationId?: string;
    serviceType: string;
    workflowId?: string;
    routingContext: RoutingContext;
    sourceLocation: any;
    resolutionSource: ResolutionSource;
    confidence: number;
    matchType: MatchType;
    routingDecision: RoutingDecision;
    status: ResolutionStatus;
    jurisdictionVersion: string;
  }) {
    return this.prisma.jurisdictionResolution.create({
      data: {
        routingTargetType: data.routingTargetType,
        routingTargetId: data.routingTargetId,
        policeStationId: data.policeStationId || null,
        serviceType: data.serviceType,
        workflowId: data.workflowId || null,
        routingContext: data.routingContext,
        sourceLocation: data.sourceLocation,
        resolutionSource: data.resolutionSource,
        confidence: data.confidence,
        matchType: data.matchType,
        routingDecision: data.routingDecision,
        status: data.status,
        jurisdictionVersion: data.jurisdictionVersion,
      },
    });
  }

  async updateResolution(
    id: string,
    data: {
      status?: ResolutionStatus;
      policeStationId?: string;
      routingTargetType?: RoutingTargetType;
      routingTargetId?: string;
      routingDecision?: RoutingDecision;
      workflowId?: string;
    }
  ) {
    return this.prisma.jurisdictionResolution.update({
      where: { id },
      data: {
        status: data.status,
        policeStationId: data.policeStationId,
        routingTargetType: data.routingTargetType,
        routingTargetId: data.routingTargetId,
        routingDecision: data.routingDecision,
        workflowId: data.workflowId,
      },
    });
  }

  async getResolution(id: string) {
    return this.prisma.jurisdictionResolution.findUnique({
      where: { id },
      include: {
        policeStation: true,
        history: true,
        events: true,
      },
    });
  }

  async createHistory(data: {
    jurisdictionResolutionId: string;
    previousStatus?: ResolutionStatus;
    newStatus: ResolutionStatus;
    previousStationId?: string;
    newStationId?: string;
    previousTargetType?: RoutingTargetType;
    previousTargetId?: string;
    newTargetType?: RoutingTargetType;
    newTargetId?: string;
    reason?: string;
    actorType?: ActorType;
    actorId?: string;
  }) {
    return this.prisma.jurisdictionResolutionHistory.create({
      data: {
        jurisdictionResolutionId: data.jurisdictionResolutionId,
        previousStatus: data.previousStatus || null,
        newStatus: data.newStatus,
        previousStationId: data.previousStationId || null,
        newStationId: data.newStationId || null,
        previousTargetType: data.previousTargetType || null,
        previousTargetId: data.previousTargetId || null,
        newTargetType: data.newTargetType || null,
        newTargetId: data.newTargetId || null,
        reason: data.reason || null,
        actorType: data.actorType || null,
        actorId: data.actorId || null,
      },
    });
  }

  async createEvent(data: {
    jurisdictionResolutionId: string;
    eventType: ResolutionEventType;
    actorType?: ActorType;
    actorId?: string;
    metadata?: any;
  }) {
    return this.prisma.jurisdictionResolutionEvent.create({
      data: {
        jurisdictionResolutionId: data.jurisdictionResolutionId,
        eventType: data.eventType,
        actorType: data.actorType || null,
        actorId: data.actorId || null,
        metadata: data.metadata || {},
      },
    });
  }

  async queryAnalytics() {
    const resolutions = await this.prisma.jurisdictionResolution.findMany();
    const history = await this.prisma.jurisdictionResolutionHistory.findMany();
    const events = await this.prisma.jurisdictionResolutionEvent.findMany();
    return { resolutions, history, events };
  }
}
