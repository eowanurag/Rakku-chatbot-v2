import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface TrackingStatus {
  referenceNumber: string;
  serviceType: string;
  status: string;
  updatedAt: Date;
  createdAt: Date;
  timeline: string;
}

function formatDate(date: any): string {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatStatus(status: string): string {
  const words = status.replace(/_/g, ' ').toLowerCase().split(' ');
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(private prisma: PrismaService) {}

  async track(refNum: string): Promise<TrackingStatus | null> {
    const refUpper = refNum.trim().toUpperCase().replace(/\s+/g, '-').replace(/-+/g, '-');
    try {
      const record = await this.prisma.trackingRecord.findUnique({
        where: { referenceNumber: refUpper },
      });

      if (record) {
        let history: any[] = [];
        if (record.statusHistory) {
          history = typeof record.statusHistory === 'string'
            ? JSON.parse(record.statusHistory)
            : record.statusHistory as unknown as any[];
        }

        let timeline = '';
        if (history && history.length > 0) {
          timeline = '\n\n**Application Timeline**\n\n';
          for (const item of history) {
            timeline += `✓ ${formatStatus(item.status)}\n${formatDate(item.timestamp)}\n\n`;
          }
        }

        return {
          referenceNumber: record.referenceNumber,
          serviceType: record.serviceType,
          status: record.currentStatus.replace(/_/g, ' ').toUpperCase(),
          updatedAt: record.updatedAt,
          createdAt: record.createdAt,
          timeline: timeline,
        };
      }
    } catch (e) {
      this.logger.error(`Failed to track reference number ${refUpper}: ${e.message}`);
    }
    return null;
  }
}
