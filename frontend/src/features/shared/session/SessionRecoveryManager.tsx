"use client";

import React, { useEffect, useState } from "react";
import { sessionPersistence, RecoveryDraft } from "./sessionPersistence";
import { useWorkflowStore } from "../../../state/workflowStore";
import { useSessionHydration } from "./sessionHydration";

export const SessionRecoveryManager: React.FC = () => {
  const isHydrated = useSessionHydration();
  const [draft, setDraft] = useState<RecoveryDraft | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  const clearWorkflow = useWorkflowStore((state) => state.clearWorkflow);
  const setWorkflow = useWorkflowStore((state) => state.setWorkflow);
  const updateDraft = useWorkflowStore((state) => state.updateDraft);
  const setCurrentStep = useWorkflowStore((state) => state.setCurrentStep);

  useEffect(() => {
    if (!isHydrated) return;

    const activeDraft = sessionPersistence.getValidRecoveryDraft();
    if (activeDraft) {
      setDraft(activeDraft);
      setShowPrompt(true);
    }
  }, [isHydrated]);

  const handleRestore = () => {
    if (draft) {
      // Load restored parameters into active store state
      setWorkflow(draft.activeWorkflowId, draft.sessionId);
      updateDraft(draft.draftData);
      if (draft.currentStep) {
        setCurrentStep(draft.currentStep);
      }
    }
    setShowPrompt(false);
  };

  const handleDiscard = () => {
    sessionPersistence.clearRecoveryDraft();
    clearWorkflow();
    setShowPrompt(false);
  };

  if (!showPrompt || !draft) return null;

  const getWorkflowLabel = (id: string) => {
    switch (id) {
      case "lost-mobile": return "Lost Mobile Report";
      case "lost-documents": return "Lost Document Report";
      case "character-certificate": return "Character Certificate Form";
      case "event-permission": return "Event Permission Form";
      default: return "Service Application Form";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden transition-all transform scale-100">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">👮</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Restore Draft Progress?
            </h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            We found an unfinished draft for <strong>{getWorkflowLabel(draft.activeWorkflowId)}</strong>. Would you like to resume your application?
          </p>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleDiscard}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Start New
            </button>
            <button
              onClick={handleRestore}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg shadow-md transition-colors"
            >
              Resume Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
