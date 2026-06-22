import { CONSTANTS } from "../../../config/constants";

export interface RecoveryDraft {
  activeWorkflowId: string;
  sessionId: string;
  currentStep: string | null;
  draftData: Record<string, any>;
  timestamp: number;
}

export const sessionPersistence = {
  /**
   * Reads draft state directly from persistent store and verifies TTL (e.g. 24 hours).
   */
  getValidRecoveryDraft(maxAgeMs = 24 * 60 * 60 * 1000): RecoveryDraft | null {
    if (typeof window === "undefined") return null;

    const raw = localStorage.getItem(CONSTANTS.STORAGE_KEYS.WORKFLOW_DRAFT);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      // Zustand persist wraps state in a state object: { state: { ... }, version: 0 }
      const stateData = parsed.state;
      if (!stateData || !stateData.activeWorkflowId) return null;

      const timestamp = stateData.recoveryMetadata?.timestamp || Date.now();
      const age = Date.now() - timestamp;

      if (age > maxAgeMs) {
        this.clearRecoveryDraft();
        return null;
      }

      return {
        activeWorkflowId: stateData.activeWorkflowId,
        sessionId: stateData.sessionId,
        currentStep: stateData.currentStep,
        draftData: stateData.draftData,
        timestamp,
      };
    } catch (_) {
      return null;
    }
  },

  clearRecoveryDraft(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(CONSTANTS.STORAGE_KEYS.WORKFLOW_DRAFT);
    }
  },
};
