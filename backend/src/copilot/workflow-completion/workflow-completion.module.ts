import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { WorkflowCompletionService } from './workflow-completion.service';
import { CheckpointService } from './checkpoint.service';
import { DraftRecoveryService } from './draft-recovery.service';
import { OfflineQueueService } from './offline-queue.service';
import { NotificationService } from './notification.service';
import { CitizenMetricsService } from './citizen-metrics.service';
import { WorkflowAnalyticsService } from './workflow-analytics.service';
import { WorkflowFrictionService } from './workflow-friction.service';
import { QuestionAssistanceService } from './question-assistance.service';
import { ProgressService } from './progress.service';
import { WorkflowInsightsService } from './workflow-insights.service';

@Module({
  providers: [
    PrismaService,
    WorkflowCompletionService,
    CheckpointService,
    DraftRecoveryService,
    OfflineQueueService,
    NotificationService,
    CitizenMetricsService,
    WorkflowAnalyticsService,
    WorkflowFrictionService,
    QuestionAssistanceService,
    ProgressService,
    WorkflowInsightsService
  ],
  exports: [
    WorkflowCompletionService,
    CheckpointService,
    DraftRecoveryService,
    OfflineQueueService,
    NotificationService,
    CitizenMetricsService,
    WorkflowAnalyticsService,
    WorkflowFrictionService,
    QuestionAssistanceService,
    ProgressService,
    WorkflowInsightsService
  ]
})
export class WorkflowCompletionModule {}

