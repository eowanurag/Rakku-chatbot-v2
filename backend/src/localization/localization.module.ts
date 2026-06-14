import { Module } from '@nestjs/common';
import { LocalizationService, MetricsService } from './localization.service';
import { LocalizationHealthController } from './localization.health';

@Module({
  providers: [LocalizationService, MetricsService],
  controllers: [LocalizationHealthController],
  exports: [LocalizationService, MetricsService],
})
export class LocalizationModule {}
