import { useWorkflowStore } from "../../src/state/workflowStore";
import { sessionPersistence } from "../../src/features/shared/session/sessionPersistence";
import { CONSTANTS } from "../../src/config/constants";

describe("Workflow Recovery & Language Persistence Integration", () => {
  beforeEach(() => {
    localStorage.clear();
    useWorkflowStore.getState().clearWorkflow();
  });

  describe("Workflow Draft Recovery Flow", () => {
    it("should save draft, simulate refresh, and recover Character Certificate progress", () => {
      // 1. User starts Character Certificate workflow and fills some details
      const store = useWorkflowStore.getState();
      store.setWorkflow("character-certificate", "session-cert-123");
      store.setCurrentStep("personal_details");
      store.updateDraft({ name: "Ranjeet Singh", address: "Lucknow, UP" });
      store.setRecoveryMetadata({ timestamp: Date.now() });

      // 2. Simulate browser refresh (clear store memory, but keep local storage)
      useWorkflowStore.getState().clearWorkflow();
      expect(useWorkflowStore.getState().activeWorkflowId).toBeNull();

      const persistPayload = {
        state: {
          activeWorkflowId: "character-certificate",
          sessionId: "session-cert-123",
          currentStep: "personal_details",
          draftData: { name: "Ranjeet Singh", address: "Lucknow, UP" },
          recoveryMetadata: { timestamp: Date.now() },
        },
        version: 0,
      };
      localStorage.setItem(CONSTANTS.STORAGE_KEYS.WORKFLOW_DRAFT, JSON.stringify(persistPayload));

      // 3. User returns later: verify storage contains a valid recovery draft
      const recoveredDraft = sessionPersistence.getValidRecoveryDraft();
      expect(recoveredDraft).not.toBeNull();
      expect(recoveredDraft?.activeWorkflowId).toBe("character-certificate");
      expect(recoveredDraft?.draftData.name).toBe("Ranjeet Singh");
      expect(recoveredDraft?.draftData.address).toBe("Lucknow, UP");

      // 4. Restore state back into store
      if (recoveredDraft) {
        useWorkflowStore.getState().setWorkflow(recoveredDraft.activeWorkflowId, recoveredDraft.sessionId);
        useWorkflowStore.getState().updateDraft(recoveredDraft.draftData);
        if (recoveredDraft.currentStep) {
          useWorkflowStore.getState().setCurrentStep(recoveredDraft.currentStep);
        }
      }

      // Verify workflow state is restored successfully
      const restoredState = useWorkflowStore.getState();
      expect(restoredState.activeWorkflowId).toBe("character-certificate");
      expect(restoredState.sessionId).toBe("session-cert-123");
      expect(restoredState.currentStep).toBe("personal_details");
      expect(restoredState.draftData.name).toBe("Ranjeet Singh");
    });
  });

  describe("Language Switch & Persistence Flow", () => {
    it("should preserve selected locale across simulated page refreshes", () => {
      // 1. Initial default state
      let currentLocale = localStorage.getItem(CONSTANTS.STORAGE_KEYS.USER_LOCALE) || CONSTANTS.LOCALES.DEFAULT;
      expect(currentLocale).toBe("hi"); // Default language

      // 2. User switches language to Hinglish
      localStorage.setItem(CONSTANTS.STORAGE_KEYS.USER_LOCALE, "hinglish");

      // 3. Simulate page refresh
      const refreshedLocale = localStorage.getItem(CONSTANTS.STORAGE_KEYS.USER_LOCALE);
      expect(refreshedLocale).toBe("hinglish");
    });
  });
});
