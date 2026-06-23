import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CheckpointService implements OnModuleDestroy {
  constructor(private readonly prisma: PrismaService) {}

  private debounceMap = new Map<string, NodeJS.Timeout>();

  async saveCheckpoint(sessionId: string, workflowId: string, step: string, dataSnapshot: any): Promise<void> {
    const resumeInfo = {
      workflowId,
      step,
      dataSnapshot: JSON.parse(JSON.stringify(dataSnapshot || {})),
      lastUpdatedAt: new Date().toISOString()
    };

    try {
      const session = await this.prisma.workflowSession.findUnique({
        where: { id: sessionId }
      });
      
      const state = session
        ? (typeof session.stateJson === 'string' ? JSON.parse(session.stateJson) : session.stateJson || {})
        : {};

      state.resumeInformation = resumeInfo;

      await this.prisma.workflowSession.upsert({
        where: { id: sessionId },
        update: {
          stateJson: state as any,
          currentStep: step,
          serviceType: workflowId,
          updatedAt: new Date()
        },
        create: {
          id: sessionId,
          stateJson: state as any,
          currentStep: step,
          serviceType: workflowId
        }
      });
    } catch (err) {
      console.error(`[CheckpointService] Failed to save checkpoint: ${err.message}`);
    }
  }

  saveCheckpointDebounced(sessionId: string, workflowId: string, step: string, dataSnapshot: any): void {
    if (this.debounceMap.has(sessionId)) {
      clearTimeout(this.debounceMap.get(sessionId)!);
    }

    const timeout = setTimeout(async () => {
      await this.saveCheckpoint(sessionId, workflowId, step, dataSnapshot);
      this.debounceMap.delete(sessionId);
    }, 500);

    this.debounceMap.set(sessionId, timeout);
  }

  onModuleDestroy() {
    for (const timeout of this.debounceMap.values()) {
      clearTimeout(timeout);
    }
    this.debounceMap.clear();
  }
}
