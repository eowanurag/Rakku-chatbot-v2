import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ComplaintIntelligenceService } from './complaint-intelligence.service';
import { ComplaintIntelligenceController } from './complaint-intelligence.controller';
import { CopilotTelemetryListener } from './copilot-telemetry.listener';
import { ComplaintCompletenessService } from './services/complaint-completeness.service';
import { MissingSuggestionsService } from './services/missing-suggestions.service';
import { ComplaintGuidanceService } from './services/complaint-guidance.service';
import { TimelineGeneratorService } from './services/timeline-generator.service';
import { ActionCardService } from './services/action-card.service';
import { FieldAssistanceService } from './services/field-assistance.service';
import { MissingInformationService } from './services/missing-information.service';
import { ComplaintQualityService } from './services/complaint-quality.service';
import { ComplaintSummaryService } from './services/complaint-summary.service';
import { EvidenceGuidanceService } from './services/evidence-guidance.service';
import { JurisdictionGuidanceService } from './services/jurisdiction-guidance.service';

@Module({
  controllers: [ComplaintIntelligenceController],
  providers: [
    ComplaintIntelligenceService,
    PrismaService,
    CopilotTelemetryListener,
    ComplaintCompletenessService,
    MissingSuggestionsService,
    ComplaintGuidanceService,
    TimelineGeneratorService,
    ActionCardService,
    FieldAssistanceService,
    MissingInformationService,
    ComplaintQualityService,
    ComplaintSummaryService,
    EvidenceGuidanceService,
    JurisdictionGuidanceService
  ],
  exports: [
    ComplaintIntelligenceService,
    ComplaintCompletenessService,
    MissingSuggestionsService,
    ComplaintGuidanceService,
    TimelineGeneratorService,
    ActionCardService,
    FieldAssistanceService,
    MissingInformationService,
    ComplaintQualityService,
    ComplaintSummaryService,
    EvidenceGuidanceService,
    JurisdictionGuidanceService
  ],
})
export class ComplaintIntelligenceModule {}


