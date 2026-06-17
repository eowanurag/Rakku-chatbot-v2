import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface ServiceMapping {
  workflowId: string;
  displayName: string;
  requiresPrerequisites: boolean;
}

@Injectable()
export class WorkflowRegistryService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowRegistryService.name);
  private mappings: Record<string, ServiceMapping> = {};

  onModuleInit() {
    this.loadMappings();
  }

  private loadMappings() {
    try {
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

      const mappingsPath = findSharedFile('service-mappings.json');
      this.logger.log(`Loading service mappings from: ${mappingsPath}`);
      const rawData = fs.readFileSync(mappingsPath, 'utf8');
      const data = JSON.parse(rawData);
      this.mappings = data.mappings || {};
      this.logger.log(`Loaded ${Object.keys(this.mappings).length} service mappings successfully.`);
    } catch (error) {
      this.logger.error('Failed to load service-mappings.json:', error);
      throw error;
    }
  }

  getMapping(serviceName: string): ServiceMapping | undefined {
    return this.mappings[serviceName];
  }

  getAllMappings(): Record<string, ServiceMapping> {
    return { ...this.mappings };
  }
}
