import { Module } from '@nestjs/common';
import { HelplineService } from './helpline.service';
import { PoliceStationService } from './police-station.service';
import { AnalyticsService } from './analytics.service';
import { CitizenAssistanceController } from './citizen-assistance.controller';

@Module({
  controllers: [CitizenAssistanceController],
  providers: [HelplineService, PoliceStationService, AnalyticsService],
  exports: [HelplineService, PoliceStationService, AnalyticsService],
})
export class CitizenAssistanceModule {}
