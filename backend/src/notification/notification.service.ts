import { Injectable, Logger } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { NotificationChannel, NotificationStatus } from '@prisma/client';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly repo: NotificationRepository) {}

  async sendNotification(data: {
    channel: NotificationChannel;
    template: string;
    citizenId?: string | null;
    workflowType?: string | null;
    workflowId?: string | null;
    metadata?: any;
  }) {
    this.logger.log(`Preparing notification for channel=${data.channel}, template=${data.template}, citizenId=${data.citizenId}`);

    // Create record as PENDING
    const notification = await this.repo.create({
      citizenId: data.citizenId,
      channel: data.channel,
      status: NotificationStatus.PENDING,
      template: data.template,
      workflowType: data.workflowType,
      workflowId: data.workflowId,
      metadata: data.metadata,
    });

    // Simulate sending of notification
    try {
      // Stub delivery simulation - automatically transition to SENT
      const updated = await this.repo.updateStatus(notification.id, NotificationStatus.SENT, new Date());
      this.logger.log(`Notification ${notification.id} dispatched successfully via ${data.channel}`);
      return updated;
    } catch (err) {
      this.logger.error(`Failed to dispatch notification ${notification.id}: ${err.message}`);
      return this.repo.updateStatus(notification.id, NotificationStatus.FAILED);
    }
  }
}
