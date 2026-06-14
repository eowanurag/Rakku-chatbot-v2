import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JurisdictionAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoutingDecisionMetrics() {
    const counts = await this.prisma.jurisdictionResolution.groupBy({
      by: ['routingDecision'],
      _count: {
        id: true,
      },
    });

    const result: Record<string, number> = {};
    for (const item of counts) {
      result[item.routingDecision] = item._count.id;
    }
    return result;
  }

  async getResolutionSourceMetrics() {
    const counts = await this.prisma.jurisdictionResolution.groupBy({
      by: ['resolutionSource'],
      _count: {
        id: true,
      },
    });

    const result: Record<string, number> = {};
    for (const item of counts) {
      result[item.resolutionSource] = item._count.id;
    }
    return result;
  }

  async getOverrideMetrics() {
    const count = await this.prisma.jurisdictionResolutionHistory.count({
      where: {
        newStatus: 'OVERRIDDEN',
      },
    });
    return { overrideCount: count };
  }

  async getDistrictRoutingMetrics() {
    const resolutions = await this.prisma.jurisdictionResolution.findMany({
      include: {
        policeStation: true,
      },
    });

    const counts: Record<string, number> = {};
    for (const res of resolutions) {
      const dist = res.policeStation?.districtCode || 'UNKNOWN';
      counts[dist] = (counts[dist] || 0) + 1;
    }
    return counts;
  }

  async getRoutingTargetMetrics() {
    const counts = await this.prisma.jurisdictionResolution.groupBy({
      by: ['routingTargetType'],
      _count: {
        id: true,
      },
    });

    const result: Record<string, number> = {};
    for (const item of counts) {
      result[item.routingTargetType] = item._count.id;
    }
    return result;
  }
}
