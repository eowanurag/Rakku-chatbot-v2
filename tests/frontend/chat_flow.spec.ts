// Setup mock localStorage before importing stores
if (typeof window === 'undefined') {
  (global as any).window = {};
}
if (!global.window.localStorage) {
  const store: Record<string, string> = {};
  global.window.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    length: 0,
    key: (index: number) => null,
  } as any;
}

import { useWorkflowStore } from '../../frontend/src/state/workflowStore';

describe('Frontend Chat Flow State Manager Spec', () => {
  beforeEach(() => {
    useWorkflowStore.getState().clearWorkflow();
  });

  it('should initialize with default empty workflow state', () => {
    const state = useWorkflowStore.getState();
    expect(state.activeWorkflowId).toBeNull();
    expect(state.currentStep).toBeNull();
    expect(state.draftData).toEqual({});
    expect(state.sessionId).toBeNull();
  });

  it('should set active workflow and session ID', () => {
    useWorkflowStore.getState().setWorkflow('lost_mobile', 'session-123');
    
    const state = useWorkflowStore.getState();
    expect(state.activeWorkflowId).toBe('lost_mobile');
    expect(state.sessionId).toBe('session-123');
    expect(state.draftData).toEqual({});
  });

  it('should update draft data and set step transition correctly', () => {
    const store = useWorkflowStore.getState();
    store.setWorkflow('lost_mobile', 'session-123');
    store.setCurrentStep('brand');
    store.updateDraft({ brand: 'Samsung' });

    const state = useWorkflowStore.getState();
    expect(state.currentStep).toBe('brand');
    expect(state.draftData.brand).toBe('Samsung');
  });

  it('should clear workflow state completely on exit/clear', () => {
    const store = useWorkflowStore.getState();
    store.setWorkflow('lost_mobile', 'session-123');
    store.setCurrentStep('brand');
    store.updateDraft({ brand: 'Samsung' });
    store.clearWorkflow();

    const state = useWorkflowStore.getState();
    expect(state.activeWorkflowId).toBeNull();
    expect(state.currentStep).toBeNull();
    expect(state.draftData).toEqual({});
  });
});
