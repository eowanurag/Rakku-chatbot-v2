import { Module } from '@nestjs/common';
import { HelplineService } from './helpline.service';
import { PoliceStationService } from './police-station.service';
import { AnalyticsService } from './analytics.service';
import { IntelligenceService } from './intelligence.service';
import { IntelligenceController } from './intelligence.controller';
import { PrismaService } from '../prisma.service';
import { CitizenAssistanceController } from './citizen-assistance.controller';
import { JurisdictionRoutingModule } from '../jurisdiction-routing/jurisdiction-routing.module';
import { SubmissionFingerprintService } from '../security/submission-fingerprint.service';
import { WorkflowCompletionModule } from '../copilot/workflow-completion/workflow-completion.module';

@Module({
  imports: [JurisdictionRoutingModule, WorkflowCompletionModule],
  controllers: [CitizenAssistanceController, IntelligenceController],
  providers: [HelplineService, PoliceStationService, AnalyticsService, IntelligenceService, PrismaService, SubmissionFingerprintService],
  exports: [HelplineService, PoliceStationService, AnalyticsService, IntelligenceService, SubmissionFingerprintService],
})
export class CitizenAssistanceModule {}
