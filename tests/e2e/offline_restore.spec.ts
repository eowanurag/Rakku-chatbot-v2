import { OfflineSyncService } from '../../frontend/src/services/offline-sync';

describe('Offline Restore E2E Spec', () => {
  beforeAll(() => {
    const store = new Map<string, string>();
    global.window = {
      localStorage: {
        setItem: (key: string, value: string) => store.set(key, value),
        getItem: (key: string) => store.get(key) || null,
        removeItem: (key: string) => store.delete(key),
        clear: () => store.clear(),
        length: 0,
        key: (index: number) => null,
      }
    } as any;
  });

  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it('should save and restore drafts successfully', () => {
    const mockDraftData = { name: 'Ramesh', mobile: '9988776655' };
    OfflineSyncService.saveDraft('LOST_MOBILE', '2_brand', mockDraftData);
    
    const restored = OfflineSyncService.restoreDraft();
    expect(restored).not.toBeNull();
    expect(restored?.workflow).toBe('LOST_MOBILE');
    expect(restored?.step).toBe('2_brand');
    expect(restored?.data).toEqual(mockDraftData);
  });

  it('should track pending submissions count and queue status', () => {
    expect(OfflineSyncService.hasPendingSubmissions()).toBe(false);
    
    OfflineSyncService.addToQueue('LOST_MOBILE', { test: 'payload' });
    expect(OfflineSyncService.hasPendingSubmissions()).toBe(true);
    expect(OfflineSyncService.getPendingSubmissionsCount()).toBe(1);

    const status = OfflineSyncService.getRetryQueueStatus();
    expect(status.pendingCount).toBe(1);
    expect(status.hasFailedItems).toBe(false);
  });
});
