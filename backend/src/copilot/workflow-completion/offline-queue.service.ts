import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export interface OfflineQueueItem {
  id: string;
  sessionId: string;
  workflowId: string;
  payload: any;
  retryCount: number;
  createdAt: Date;
}

@Injectable()
export class OfflineQueueService {
  private queue: OfflineQueueItem[] = [];
  public readonly MAX_RETRIES = 5;

  constructor(private readonly prisma: PrismaService) {}

  async enqueue(item: Omit<OfflineQueueItem, 'retryCount' | 'createdAt'>): Promise<void> {
    const queueItem: OfflineQueueItem = {
      ...item,
      retryCount: 0,
      createdAt: new Date()
    };
    this.queue.push(queueItem);

    try {
      await this.prisma.offlineSyncEvent.create({
        data: {
          syncId: queueItem.id,
          eventType: 'OFFLINE_QUEUED',
          payloadSize: JSON.stringify(queueItem.payload).length,
          success: true
        }
      });
    } catch (err) {
      console.error(`[OfflineQueueService] Failed to create offline sync log: ${err.message}`);
    }
  }

  async processQueue(processItemFn: (item: OfflineQueueItem) => Promise<boolean>): Promise<void> {
    const itemsToProcess = [...this.queue];
    for (const item of itemsToProcess) {
      if (item.retryCount >= this.MAX_RETRIES) {
        this.queue = this.queue.filter(q => q.id !== item.id);
        try {
          await this.prisma.offlineSyncEvent.create({
            data: {
              syncId: item.id,
              eventType: 'OFFLINE_SYNC_FAILED_MAX_RETRIES',
              payloadSize: JSON.stringify(item.payload).length,
              success: false
            }
          });
        } catch (err) {
          // ignore
        }
        continue;
      }

      // Exponential backoff check: delay = 2^retryCount * 100ms (smaller for test speed but conforming to exponential scale)
      const delayMs = Math.pow(2, item.retryCount) * 100;
      const now = new Date();
      if (now.getTime() - item.createdAt.getTime() < delayMs) {
        continue;
      }

      try {
        const success = await processItemFn(item);
        if (success) {
          this.queue = this.queue.filter(q => q.id !== item.id);
          try {
            await this.prisma.offlineSyncEvent.create({
              data: {
                syncId: item.id,
                eventType: 'OFFLINE_SYNC_SUCCESS',
                payloadSize: JSON.stringify(item.payload).length,
                success: true
              }
            });

            await this.prisma.citizenWorkflowEvent.create({
              data: {
                sessionId: item.sessionId,
                workflowType: item.workflowId,
                eventType: 'OFFLINE_RECOVERED'
              }
            });
          } catch (err) {
            // ignore
          }
        } else {
          item.retryCount++;
        }
      } catch (err) {
        item.retryCount++;
      }
    }
  }

  getQueue(): OfflineQueueItem[] {
    return this.queue;
  }
}
