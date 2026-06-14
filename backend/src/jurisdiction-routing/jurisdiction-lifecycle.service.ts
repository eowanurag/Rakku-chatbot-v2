import { Injectable, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JurisdictionRepository } from './jurisdiction.repository';
import { ResolutionStatus, ActorType, RoutingDecision, ResolutionEventType } from './jurisdiction-routing.types';

@Injectable()
export class JurisdictionLifecycleService {
  constructor(
    private readonly repository: JurisdictionRepository,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async confirmResolution(
    resolutionId: string,
    decision: 'USER_CONFIRMED' | 'USER_SELECTED',
    actorType: ActorType = ActorType.CITIZEN,
    actorId?: string
  ) {
    const resolution = await this.repository.getResolution(resolutionId);
    if (!resolution) {
      throw new BadRequestException('Jurisdiction resolution not found.');
    }

    if (resolution.status !== ResolutionStatus.PENDING) {
      throw new BadRequestException(`Cannot confirm resolution in ${resolution.status} status.`);
    }

    const updated = await this.repository.updateResolution(resolutionId, {
      status: ResolutionStatus.CONFIRMED,
      routingDecision: decision === 'USER_CONFIRMED' ? RoutingDecision.USER_CONFIRMED : RoutingDecision.USER_SELECTED,
    });

    await this.repository.createHistory({
      jurisdictionResolutionId: resolutionId,
      previousStatus: ResolutionStatus.PENDING,
      newStatus: ResolutionStatus.CONFIRMED,
      previousStationId: resolution.policeStationId || undefined,
      newStationId: resolution.policeStationId || undefined,
      reason: 'Citizen confirmed station resolution',
      actorType,
      actorId,
    });

    await this.repository.createEvent({
      jurisdictionResolutionId: resolutionId,
      eventType: decision === 'USER_CONFIRMED' ? ResolutionEventType.USER_CONFIRMED : ResolutionEventType.USER_SELECTED,
      actorType,
      actorId,
    });

    this.eventEmitter.emit('ResolutionConfirmed', updated);
    return updated;
  }

  async overrideResolution(
    resolutionId: string,
    newStationId: string,
    reason: string = 'Administrative override',
    actorType: ActorType = ActorType.OFFICER,
    actorId?: string
  ) {
    const resolution = await this.repository.getResolution(resolutionId);
    if (!resolution) {
      throw new BadRequestException('Jurisdiction resolution not found.');
    }

    // Allowed transition: CONFIRMED -> OVERRIDDEN
    if (resolution.status !== ResolutionStatus.CONFIRMED) {
      throw new BadRequestException(`Cannot override resolution in ${resolution.status} status.`);
    }

    const updated = await this.repository.updateResolution(resolutionId, {
      status: ResolutionStatus.OVERRIDDEN,
      policeStationId: newStationId,
      routingTargetId: newStationId,
    });

    await this.repository.createHistory({
      jurisdictionResolutionId: resolutionId,
      previousStatus: ResolutionStatus.CONFIRMED,
      newStatus: ResolutionStatus.OVERRIDDEN,
      previousStationId: resolution.policeStationId || undefined,
      newStationId,
      reason,
      actorType,
      actorId,
    });

    await this.repository.createEvent({
      jurisdictionResolutionId: resolutionId,
      eventType: ResolutionEventType.OVERRIDDEN,
      actorType,
      actorId,
      metadata: { reason },
    });

    this.eventEmitter.emit('ResolutionOverridden', updated);
    return updated;
  }

  async expireResolution(
    resolutionId: string,
    reason: string = 'Registry configuration change',
    actorType: ActorType = ActorType.SYSTEM,
    actorId?: string
  ) {
    const resolution = await this.repository.getResolution(resolutionId);
    if (!resolution) {
      throw new BadRequestException('Jurisdiction resolution not found.');
    }

    if (resolution.status !== ResolutionStatus.CONFIRMED) {
      throw new BadRequestException(`Cannot expire resolution in ${resolution.status} status.`);
    }

    const updated = await this.repository.updateResolution(resolutionId, {
      status: ResolutionStatus.EXPIRED,
    });

    await this.repository.createHistory({
      jurisdictionResolutionId: resolutionId,
      previousStatus: ResolutionStatus.CONFIRMED,
      newStatus: ResolutionStatus.EXPIRED,
      previousStationId: resolution.policeStationId || undefined,
      newStationId: resolution.policeStationId || undefined,
      reason,
      actorType,
      actorId,
    });

    await this.repository.createEvent({
      jurisdictionResolutionId: resolutionId,
      eventType: ResolutionEventType.EXPIRED,
      actorType,
      actorId,
      metadata: { reason },
    });

    this.eventEmitter.emit('ResolutionExpired', updated);
    return updated;
  }
}
