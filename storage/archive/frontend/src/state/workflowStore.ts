import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CONSTANTS } from "../config/constants";

interface WorkflowState {
  activeWorkflowId: string | null;
  currentStep: string | null;
  draftData: Record<string, any>;
  sessionId: string | null;
  recoveryMetadata: Record<string, any>;
  setWorkflow: (workflowId: string | null, sessionId: string | null) => void;
  setCurrentStep: (step: string | null) => void;
  updateDraft: (data: Record<string, any>) => void;
  clearWorkflow: () => void;
  setRecoveryMetadata: (meta: Record<string, any>) => void;
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set) => ({
      activeWorkflowId: null,
      currentStep: null,
      draftData: {},
      sessionId: null,
      recoveryMetadata: {},
      setWorkflow: (workflowId, sessionId) =>
        set({ activeWorkflowId: workflowId, sessionId, draftData: {}, currentStep: null }),
      setCurrentStep: (step) => set({ currentStep: step }),
      updateDraft: (data) =>
        set((state) => ({ draftData: { ...state.draftData, ...data } })),
      clearWorkflow: () =>
        set({ activeWorkflowId: null, currentStep: null, draftData: {}, sessionId: null, recoveryMetadata: {} }),
      setRecoveryMetadata: (meta) => set({ recoveryMetadata: meta }),
    }),
    {
      name: CONSTANTS.STORAGE_KEYS.WORKFLOW_DRAFT,
    }
  )
);
