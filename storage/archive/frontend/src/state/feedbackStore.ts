import { create } from "zustand";
import { ServiceFeedback } from "../types/feedback.types";

interface FeedbackState {
  pendingFeedbackSessionId: string | null;
  history: ServiceFeedback[];
  setPendingFeedbackSessionId: (sessionId: string | null) => void;
  addFeedbackToHistory: (feedback: ServiceFeedback) => void;
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  pendingFeedbackSessionId: null,
  history: [],
  setPendingFeedbackSessionId: (sessionId) => set({ pendingFeedbackSessionId: sessionId }),
  addFeedbackToHistory: (feedback) =>
    set((state) => ({ history: [...state.history, feedback], pendingFeedbackSessionId: null })),
}));
