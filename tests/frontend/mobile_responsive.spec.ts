import { useUIStore } from '../../frontend/src/state/uiStore';

describe('Frontend Mobile Responsive and UI Layout Spec', () => {
  beforeEach(() => {
    // Reset stores if needed, or trigger default state
    useUIStore.setState({
      theme: "light",
      isSidebarOpen: false,
      activeModalId: null
    });
  });

  it('should initialize with default UI theme and sidebar state', () => {
    const state = useUIStore.getState();
    expect(state.theme).toBe("light");
    expect(state.isSidebarOpen).toBe(false);
    expect(state.activeModalId).toBeNull();
  });

  it('should toggle theme from light to dark and back', () => {
    const store = useUIStore.getState();
    
    store.toggleTheme();
    expect(useUIStore.getState().theme).toBe("dark");

    store.toggleTheme();
    expect(useUIStore.getState().theme).toBe("light");
  });

  it('should update sidebar open/close state', () => {
    const store = useUIStore.getState();

    store.setSidebarOpen(true);
    expect(useUIStore.getState().isSidebarOpen).toBe(true);

    store.setSidebarOpen(false);
    expect(useUIStore.getState().isSidebarOpen).toBe(false);
  });

  it('should open and close modals dynamically', () => {
    const store = useUIStore.getState();

    store.openModal('feedback-modal');
    expect(useUIStore.getState().activeModalId).toBe('feedback-modal');

    store.closeModal();
    expect(useUIStore.getState().activeModalId).toBeNull();
  });
});
