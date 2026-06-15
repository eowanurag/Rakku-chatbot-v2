import { useWorkflowStore } from "../../src/state/workflowStore";

describe("Zustand workflowStore state actions", () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    useWorkflowStore.getState().clearWorkflow();
  });

  it("should initialize with default null parameters", () => {
    const state = useWorkflowStore.getState();
    expect(state.activeWorkflowId).toBeNull();
    expect(state.currentStep).toBeNull();
    expect(state.draftData).toEqual({});
  });

  it("should set workflow id and session ID", () => {
    useWorkflowStore.getState().setWorkflow("complaint-registration", "session-xyz");
    const state = useWorkflowStore.getState();
    expect(state.activeWorkflowId).toBe("complaint-registration");
    expect(state.sessionId).toBe("session-xyz");
  });

  it("should merge draft form data fields incrementally", () => {
    useWorkflowStore.getState().updateDraft({ name: "Ramesh" });
    useWorkflowStore.getState().updateDraft({ mobile: "9876543210" });
    const state = useWorkflowStore.getState();
    expect(state.draftData).toEqual({
      name: "Ramesh",
      mobile: "9876543210",
    });
  });
});
