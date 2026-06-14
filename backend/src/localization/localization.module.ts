import { Module } from '@nestjs/common';
import { LocalizationService, MetricsService } from './localization.service';
import { LocalizationHealthController } from './localization.health';
import { LocalizationTelemetryListener } from './localization-telemetry.listener';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [LocalizationService, MetricsService, LocalizationTelemetryListener, PrismaService],
  controllers: [LocalizationHealthController],
  exports: [LocalizationService, MetricsService],
})
export class LocalizationModule {}

