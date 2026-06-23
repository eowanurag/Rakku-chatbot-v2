import { OfflineQueueService, OfflineQueueItem } from '@backend/copilot/workflow-completion/offline-queue.service';
import { PrismaService } from '@backend/prisma.service';

describe('Offline Queue Retry & Backoff Spec', () => {
  let prisma: PrismaService;
  let offlineQueueService: OfflineQueueService;

  beforeAll(async () => {
    jest.setTimeout(45000);
    prisma = new PrismaService();
    offlineQueueService = new OfflineQueueService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should enqueue and successfully process offline queue item', async () => {
    const syncId = `sync-success-${Date.now()}`;
    const sess = `sess-sync-succ-${Date.now()}`;

    // 1. Enqueue item
    await offlineQueueService.enqueue({
      id: syncId,
      sessionId: sess,
      workflowId: 'complaint',
      payload: { test: 'data' }
    });

    const queue = offlineQueueService.getQueue();
    expect(queue.some(q => q.id === syncId)).toBe(true);

    // Verify OFFLINE_QUEUED event in DB
    const event = await prisma.offlineSyncEvent.findFirst({
      where: { syncId, eventType: 'OFFLINE_QUEUED' }
    });
    expect(event).toBeDefined();
    expect(event?.success).toBe(true);

    // 2. Process with success
    await offlineQueueService.processQueue(async (item) => {
      expect(item.id).toBe(syncId);
      return true;
    });

    // Queue should now be empty for this item
    const queueAfter = offlineQueueService.getQueue();
    expect(queueAfter.some(q => q.id === syncId)).toBe(false);

    // Verify DB events
    const successEvent = await prisma.offlineSyncEvent.findFirst({
      where: { syncId, eventType: 'OFFLINE_SYNC_SUCCESS' }
    });
    expect(successEvent).toBeDefined();

    const workflowEvent = await prisma.citizenWorkflowEvent.findFirst({
      where: { sessionId: sess, eventType: 'OFFLINE_RECOVERED' }
    });
    expect(workflowEvent).toBeDefined();
  });

  it('should back off and eventually drop item after MAX_RETRIES', async () => {
    const syncId = `sync-fail-${Date.now()}`;
    const sess = `sess-sync-fail-${Date.now()}`;

    // 1. Enqueue item
    await offlineQueueService.enqueue({
      id: syncId,
      sessionId: sess,
      workflowId: 'complaint',
      payload: { test: 'fail-data' }
    });

    // 2. Loop process until MAX_RETRIES (5)
    // We mock item's createdAt to bypass exponential backoff timing check in tests
    for (let i = 0; i < 5; i++) {
      const queue = offlineQueueService.getQueue();
      const item = queue.find(q => q.id === syncId);
      if (item) {
        // Set createdAt to a time in the past to satisfy backoff
        item.createdAt = new Date(Date.now() - 100000);
      }

      await offlineQueueService.processQueue(async () => {
        // Return false to simulate connection failure
        return false;
      });

      const queueCheck = offlineQueueService.getQueue();
      const itemCheck = queueCheck.find(q => q.id === syncId);
      if (i < 4) {
        expect(itemCheck).toBeDefined();
        expect(itemCheck?.retryCount).toBe(i + 1);
      } else {
        // On the 5th retry, it is processed and dropped because retryCount reaches MAX_RETRIES (5) on next pass
      }
    }

    // Process one more time to trigger dropping the item (since retryCount = 5)
    await offlineQueueService.processQueue(async () => false);

    const finalQueue = offlineQueueService.getQueue();
    expect(finalQueue.some(q => q.id === syncId)).toBe(false);

    // Verify OFFLINE_SYNC_FAILED_MAX_RETRIES event in DB
    const failEvent = await prisma.offlineSyncEvent.findFirst({
      where: { syncId, eventType: 'OFFLINE_SYNC_FAILED_MAX_RETRIES' }
    });
    expect(failEvent).toBeDefined();
    expect(failEvent?.success).toBe(false);
  });
});
