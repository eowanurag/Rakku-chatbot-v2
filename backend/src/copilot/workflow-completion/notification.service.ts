import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async createInAppNotification(params: {
    citizenId: string;
    template: string;
    workflowType?: string;
    workflowId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          citizenId: params.citizenId,
          channel: 'PUSH', // Strictly PUSH (In-App) per Recommendation 8
          status: 'SENT',
          template: params.template,
          workflowType: params.workflowType || null,
          workflowId: params.workflowId || null,
          metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : null,
          sentAt: new Date()
        }
      });
    } catch (err) {
      console.error(`[NotificationService] Failed to create in-app notification: ${err.message}`);
    }
  }

  async getNotificationsForCitizen(citizenId: string) {
    return this.prisma.notification.findMany({
      where: {
        citizenId,
        channel: 'PUSH'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}
