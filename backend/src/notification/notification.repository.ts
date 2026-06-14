import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationChannel, NotificationStatus } from '@prisma/client';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    citizenId?: string | null;
    channel: NotificationChannel;
    status: NotificationStatus;
    template: string;
    workflowType?: string | null;
    workflowId?: string | null;
    metadata?: any;
  }) {
    return this.prisma.notification.create({
      data: {
        citizenId: data.citizenId || null,
        channel: data.channel,
        status: data.status,
        template: data.template,
        workflowType: data.workflowType || null,
        workflowId: data.workflowId || null,
        metadata: data.metadata || {},
      },
    });
  }

  async findById(id: string) {
    return this.prisma.notification.findUnique({
      where: { id },
      include: { citizen: true },
    });
  }

  async findByCitizenId(citizenId: string) {
    return this.prisma.notification.findMany({
      where: { citizenId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: NotificationStatus, sentAt?: Date) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        status,
        sentAt: sentAt || (status === NotificationStatus.SENT ? new Date() : undefined),
      },
    });
  }
}
