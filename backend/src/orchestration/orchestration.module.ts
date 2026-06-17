import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WorkflowRegistryService } from './workflow-registry.service';
import { WorkflowRegistryValidator } from './workflow-registry.validator';
import { WorkflowLauncherService } from './workflow-launcher.service';
import { RecommendationRouterService } from './recommendation-router.service';

@Module({
  imports: [EventEmitterModule],
  providers: [
    WorkflowRegistryService,
    WorkflowRegistryValidator,
    WorkflowLauncherService,
    RecommendationRouterService,
  ],
  exports: [
    WorkflowRegistryService,
    WorkflowRegistryValidator,
    WorkflowLauncherService,
    RecommendationRouterService,
  ],
})
export class OrchestrationModule {}
