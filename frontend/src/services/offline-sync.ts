export interface OfflineQueueItem {
  id: string;
  sessionId: string;
  workflowId: string;
  payload: any;
  retryCount: number;
  createdAt: string;
}

export class OfflineSyncService {
  private static DRAFT_KEY = 'rakku_offline_draft';
  private static QUEUE_KEY = 'rakku_offline_queue';

  public static saveDraft(workflow: string, step: string, data: any): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const draft = { workflow, step, data, timestamp: new Date().toISOString() };
      window.localStorage.setItem(this.DRAFT_KEY, JSON.stringify(draft));
    }
  }

  public static getDraft(): { workflow: string; step: string; data: any; timestamp: string } | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const item = window.localStorage.getItem(this.DRAFT_KEY);
      return item ? JSON.parse(item) : null;
    }
    return null;
  }

  public static clearDraft(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(this.DRAFT_KEY);
    }
  }

  public static restoreDraft(): { workflow: string; step: string; data: any; timestamp: string } | null {
    return this.getDraft();
  }

  public static addToQueue(workflowId: string, payload: any, sessionId: string = 'default-session'): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const queue = this.getQueue();
      const newItem: OfflineQueueItem = {
        id: Math.random().toString(36).substring(7),
        sessionId,
        workflowId,
        payload,
        retryCount: 0,
        createdAt: new Date().toISOString()
      };
      queue.push(newItem);
      window.localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    }
  }

  public static getQueue(): OfflineQueueItem[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      const item = window.localStorage.getItem(this.QUEUE_KEY);
      return item ? JSON.parse(item) : [];
    }
    return [];
  }

  public static clearQueue(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(this.QUEUE_KEY);
    }
  }

  public static getPendingSubmissionsCount(): number {
    return this.getQueue().length;
  }

  public static hasPendingSubmissions(): boolean {
    return this.getPendingSubmissionsCount() > 0;
  }

  public static getRetryQueueStatus(): { hasFailedItems: boolean; pendingCount: number; items: OfflineQueueItem[] } {
    const items = this.getQueue();
    const hasFailedItems = items.some(item => item.retryCount > 0);
    return {
      hasFailedItems,
      pendingCount: items.length,
      items
    };
  }
}
