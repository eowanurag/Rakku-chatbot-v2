import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class IncidentClusteringService {
  constructor(private readonly prisma: PrismaService) {}

  public async getClusterInsight(complaintType: string, policeStationId?: string): Promise<string | null> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    try {
      const count = await this.prisma.complaint.count({
        where: {
          complaintType,
          createdAt: {
            gte: oneWeekAgo
          },
          ...(policeStationId ? {
            jurisdictionResolution: {
              policeStationId
            }
          } : {})
        }
      });

      if (count > 0) {
        const typeLabel = complaintType.toLowerCase().includes('theft') || complaintType.toLowerCase().includes('mobile')
          ? 'mobile theft'
          : complaintType.toLowerCase();
        return `${count} ${typeLabel} complaints reported nearby this week.`;
      }
    } catch (e) {
      // safe fallback
    }

    return null;
  }
}
