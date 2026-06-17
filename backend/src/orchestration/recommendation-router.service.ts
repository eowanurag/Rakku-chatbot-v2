import { Injectable, Logger } from '@nestjs/common';
import { WorkflowRegistryService } from './workflow-registry.service';

@Injectable()
export class RecommendationRouterService {
  private readonly logger = new Logger(RecommendationRouterService.name);

  constructor(private readonly registryService: WorkflowRegistryService) {}

  public resolveWorkflow(recommendedServices: string[]): { workflowId: string; displayName: string } | null {
    if (!recommendedServices || recommendedServices.length === 0) {
      return null;
    }

    for (const service of recommendedServices) {
      const mapping = this.registryService.getMapping(service);
      if (mapping) {
        this.logger.log(`Resolved recommended service '${service}' to workflow '${mapping.workflowId}'`);
        return {
          workflowId: mapping.workflowId,
          displayName: mapping.displayName
        };
      }
    }

    return null;
  }
}
