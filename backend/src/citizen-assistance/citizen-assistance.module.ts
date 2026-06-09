import { Module } from '@nestjs/common';
import { HelplineService } from './helpline.service';
import { PoliceStationService } from './police-station.service';
import { AnalyticsService } from './analytics.service';
import { IntelligenceService } from './intelligence.service';
import { IntelligenceController } from './intelligence.controller';
import { PrismaService } from '../prisma.service';
import { CitizenAssistanceController } from './citizen-assistance.controller';

@Module({
  controllers: [CitizenAssistanceController, IntelligenceController],
  providers: [HelplineService, PoliceStationService, AnalyticsService, IntelligenceService, PrismaService],
  exports: [HelplineService, PoliceStationService, AnalyticsService, IntelligenceService],
})
export class CitizenAssistanceModule {}
