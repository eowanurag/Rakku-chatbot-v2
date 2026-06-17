import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { WorkflowLaunchEvent } from './interfaces/workflow-launch.interface';

@Injectable()
export class WorkflowLauncherService {
  private readonly logger = new Logger(WorkflowLauncherService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  public async launch(event: WorkflowLaunchEvent): Promise<void> {
    this.logger.log(`Emitting launch event for workflow '${event.workflowId}' in session '${event.sessionId}'`);
    await this.eventEmitter.emitAsync('workflow.launch', event);
  }

  @OnEvent('workflow.launch', { async: true })
  public async handleWorkflowLaunch(event: WorkflowLaunchEvent) {
    this.logger.log(`Handling workflow launch event: ${JSON.stringify(event)}`);
    // Decoupled log or initialization hooks can go here
  }
}
