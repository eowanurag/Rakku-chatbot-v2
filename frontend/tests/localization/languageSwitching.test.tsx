import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useTranslation } from "../../src/hooks/useTranslation";
import { useWorkflowStore } from "../../src/state/workflowStore";
import { useSessionStore } from "../../src/state/sessionStore";

describe("Language Switching State Preservation Integration", () => {
  beforeEach(() => {
    localStorage.clear();
    useWorkflowStore.getState().clearWorkflow();
    useSessionStore.getState().logout();
  });

  it("should preserve workflow and session states when switching languages", () => {
    // 1. Initialize active user session and Character Certificate workflow
    const workflowStore = useWorkflowStore.getState();
    const sessionStore = useSessionStore.getState();

    act(() => {
      sessionStore.setProfile({
        id: "cit-lko",
        name: "Vikram Sen",
        mobile: "9876543210",
        isAuthenticated: true,
      });
      workflowStore.setWorkflow("character-certificate", "session-cert-999");
      workflowStore.setCurrentStep("district_purpose");
      workflowStore.updateDraft({ district: "LKO", purpose: "Government Job" });
    });

    // Verify initial state is active
    expect(useWorkflowStore.getState().activeWorkflowId).toBe("character-certificate");
    expect(useSessionStore.getState().profile?.name).toBe("Vikram Sen");

    // 2. Instantiate translation hook
    const { result } = renderHook(() => useTranslation());

    // Switch English -> Hindi
    act(() => {
      result.current.setLocale("hi");
    });
    expect(result.current.locale).toBe("hi");

    // Verify session & workflow data remains untouched
    expect(useWorkflowStore.getState().activeWorkflowId).toBe("character-certificate");
    expect(useWorkflowStore.getState().currentStep).toBe("district_purpose");
    expect(useWorkflowStore.getState().draftData.district).toBe("LKO");
    expect(useSessionStore.getState().profile?.name).toBe("Vikram Sen");

    // Switch Hindi -> Hinglish
    act(() => {
      result.current.setLocale("hinglish");
    });
    expect(result.current.locale).toBe("hinglish");
    expect(useWorkflowStore.getState().activeWorkflowId).toBe("character-certificate");
    expect(useSessionStore.getState().profile?.name).toBe("Vikram Sen");

    // Switch Hinglish -> English
    act(() => {
      result.current.setLocale("en");
    });
    expect(result.current.locale).toBe("en");
    expect(useWorkflowStore.getState().activeWorkflowId).toBe("character-certificate");
    expect(useSessionStore.getState().profile?.name).toBe("Vikram Sen");
  });
});
