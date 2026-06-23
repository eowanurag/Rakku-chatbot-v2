import { Module } from '@nestjs/common';
import { SituationAssessmentModule } from './sae/situation-assessment.module';
import { ComplaintIntelligenceModule } from './cie/complaint-intelligence.module';
import { CueModule } from './cue/cue.module';
import { DbCieModule } from './db-cie/db-cie.module';
import { ConsensusModule } from './consensus/consensus.module';
import { SreModule } from './sre/sre.module';
import { WorkflowCompletionModule } from './workflow-completion/workflow-completion.module';

@Module({
  imports: [
    SituationAssessmentModule,
    ComplaintIntelligenceModule,
    CueModule,
    DbCieModule,
    ConsensusModule,
    SreModule,
    WorkflowCompletionModule
  ],
  exports: [
    SituationAssessmentModule,
    ComplaintIntelligenceModule,
    CueModule,
    DbCieModule,
    ConsensusModule,
    SreModule,
    WorkflowCompletionModule
  ],
})
export class CopilotModule {}


