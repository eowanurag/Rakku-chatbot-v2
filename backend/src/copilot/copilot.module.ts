import { Module } from '@nestjs/common';
import { SituationAssessmentModule } from './sae/situation-assessment.module';
import { ComplaintIntelligenceModule } from './cie/complaint-intelligence.module';
import { CueModule } from './cue/cue.module';

@Module({
  imports: [SituationAssessmentModule, ComplaintIntelligenceModule, CueModule],
  exports: [SituationAssessmentModule, ComplaintIntelligenceModule, CueModule],
})
export class CopilotModule {}

