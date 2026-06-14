import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationRepository } from './notification.repository';
import { NotificationService } from './notification.service';

@Module({
  providers: [PrismaService, NotificationRepository, NotificationService],
  exports: [NotificationService, NotificationRepository],
})
export class NotificationModule {}
