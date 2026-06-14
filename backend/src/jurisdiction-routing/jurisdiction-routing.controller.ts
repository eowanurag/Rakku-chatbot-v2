import { Controller, Get, Post, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { JurisdictionService } from './jurisdiction.service';
import { JurisdictionLifecycleService } from './jurisdiction-lifecycle.service';
import { JurisdictionAnalyticsService } from './jurisdiction-analytics.service';
import { JurisdictionRepository } from './jurisdiction.repository';
import { LocationResolutionInput, ActorType, ResolutionSource, RoutingContext } from './jurisdiction-routing.types';
import { Throttle } from '@nestjs/throttler';

@Controller()
export class JurisdictionRoutingController {
  constructor(
    private readonly service: JurisdictionService,
    private readonly lifecycleService: JurisdictionLifecycleService,
    private readonly analyticsService: JurisdictionAnalyticsService,
    private readonly repository: JurisdictionRepository
  ) {}

  @Get('jurisdiction/analytics')
  async getAnalytics() {
    const routingDecisions = await this.analyticsService.getRoutingDecisionMetrics();
    const resolutionSources = await this.analyticsService.getResolutionSourceMetrics();
    const overrides = await this.analyticsService.getOverrideMetrics();
    const districtRouting = await this.analyticsService.getDistrictRoutingMetrics();
    const routingTargets = await this.analyticsService.getRoutingTargetMetrics();

    return {
      routingDecisions,
      resolutionSources,
      overrides,
      districtRouting,
      routingTargets,
    };
  }

  @Get('jurisdiction/resolution/:id/history')
  async getResolutionHistory(@Param('id') id: string) {
    const res = await this.repository.getResolution(id);
    if (!res) {
      throw new BadRequestException('Jurisdiction resolution not found.');
    }
    return res.history;
  }

  @Post('citizen-assistance/jurisdiction/resolve')
  async resolveJurisdiction(@Body() body: LocationResolutionInput) {
    return this.service.resolveJurisdiction(body);
  }

  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('citizen-assistance/jurisdiction/lifecycle')
  async updateLifecycle(
    @Body()
    body: {
      action: 'CONFIRM' | 'OVERRIDE' | 'EXPIRE';
      resolutionId: string;
      decisionType?: 'USER_CONFIRMED' | 'USER_SELECTED';
      newStationId?: string;
      reason?: string;
      actorType?: ActorType;
      actorId?: string;
    }
  ) {
    const { action, resolutionId, decisionType, newStationId, reason, actorType, actorId } = body;
    if (!resolutionId) {
      throw new BadRequestException('resolutionId is required.');
    }

    if (action === 'CONFIRM') {
      return this.lifecycleService.confirmResolution(
        resolutionId,
        decisionType || 'USER_CONFIRMED',
        actorType,
        actorId
      );
    } else if (action === 'OVERRIDE') {
      if (!newStationId) {
        throw new BadRequestException('newStationId is required for OVERRIDE.');
      }
      return this.lifecycleService.overrideResolution(
        resolutionId,
        newStationId,
        reason,
        actorType,
        actorId
      );
    } else if (action === 'EXPIRE') {
      return this.lifecycleService.expireResolution(resolutionId, reason, actorType, actorId);
    }

    throw new BadRequestException('Invalid action.');
  }
}
