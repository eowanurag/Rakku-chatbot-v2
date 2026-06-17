import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { DictionaryUnderstandingProvider } from './runtime/providers/dictionary-understanding.provider';
import { CueService } from './runtime/cue.service';
import { DictionaryGovernanceService } from './governance/dictionary-governance.service';
import { DictionaryLifecycleService } from './governance/dictionary-lifecycle.service';
import { DictionaryExportService } from './governance/dictionary-export.service';
import { DictionaryGovernanceReportService } from './governance/dictionary-governance-report.service';
import { CueHealthService } from './analytics/cue-health.service';
import { CueReplayService } from './analytics/cue-replay.service';

@Module({
  providers: [
    PrismaService,
    DictionaryUnderstandingProvider,
    {
      provide: 'UnderstandingProvider',
      useClass: DictionaryUnderstandingProvider,
    },
    CueService,
    DictionaryGovernanceService,
    DictionaryLifecycleService,
    DictionaryExportService,
    DictionaryGovernanceReportService,
    CueHealthService,
    CueReplayService,
  ],
  exports: [
    'UnderstandingProvider',
    CueService,
    DictionaryGovernanceService,
    DictionaryLifecycleService,
    DictionaryExportService,
    DictionaryGovernanceReportService,
    CueHealthService,
    CueReplayService,
  ],
})
export class CueModule {}
