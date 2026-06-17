import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { WorkflowRegistryService } from './workflow-registry.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WorkflowRegistryValidator implements OnModuleInit {
  private readonly logger = new Logger(WorkflowRegistryValidator.name);

  constructor(private readonly registryService: WorkflowRegistryService) {}

  onModuleInit() {
    this.validate();
  }

  public validate() {
    this.logger.log('Starting workflow registry validation...');
    const mappings = this.registryService.getAllMappings();

    const findSharedFile = (filename: string): string => {
      let p = path.resolve(process.cwd(), 'shared/copilot', filename);
      if (fs.existsSync(p)) return p;
      p = path.resolve(process.cwd(), '../shared/copilot', filename);
      if (fs.existsSync(p)) return p;
      for (let i = 1; i <= 5; i++) {
        const dots = '../'.repeat(i);
        p = path.resolve(__dirname, dots, 'shared/copilot', filename);
        if (fs.existsSync(p)) return p;
      }
      return path.resolve(__dirname, filename);
    };

    const intentsPath = findSharedFile('intents.json');
    const rawIntents = fs.readFileSync(intentsPath, 'utf8');
    const intentsData = JSON.parse(rawIntents);
    const intents = intentsData.intents || {};

    const validWorkflows = ['complaint', 'verification', 'certificate', 'event', 'tracking', 'guidance'];

    for (const [intentKey, intentValue] of Object.entries<any>(intents)) {
      const recService = intentValue.recommendedService;
      if (!recService) {
        throw new Error(`Intent '${intentKey}' is missing 'recommendedService' definition.`);
      }

      const mapping = mappings[recService];
      if (!mapping) {
        throw new Error(`Recommended service '${recService}' for intent '${intentKey}' has no mapping in service-mappings.json.`);
      }

      if (!validWorkflows.includes(mapping.workflowId)) {
        throw new Error(`Mapping for service '${recService}' maps to unknown workflowId '${mapping.workflowId}'. Valid workflows are: ${validWorkflows.join(', ')}`);
      }
    }

    this.logger.log('Workflow registry validation passed successfully.');
  }
}
