import { OfflineSyncService } from '../../frontend/src/services/offline-sync';

describe('Offline Draft Resume', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    const mockLocalStorage = {
      setItem: (key: string, val: string) => { store[key] = val; },
      getItem: (key: string) => store[key] || null,
      removeItem: (key: string) => { delete store[key]; }
    };
    (global as any).window = {
      localStorage: mockLocalStorage
    } as any;
  });

  it('should recover drafts from localStorage', () => {
    OfflineSyncService.saveDraft('complaint', 'COLLECTING', { brand: 'Nokia' });
    const draft = OfflineSyncService.getDraft();
    expect(draft?.workflow).toBe('complaint');
    expect(draft?.data.brand).toBe('Nokia');
  });
});
