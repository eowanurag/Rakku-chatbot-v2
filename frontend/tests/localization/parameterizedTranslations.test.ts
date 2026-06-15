import { renderHook, act } from "@testing-library/react";
import { useTranslation } from "../../src/hooks/useTranslation";

describe("useTranslation Parameterized Interpolation", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should successfully substitute double-braced parameters", () => {
    const { result } = renderHook(() => useTranslation());
    
    // Test English parameterized template with act to flush state updates
    act(() => {
      result.current.setLocale("en");
    });
    let msg = result.current.t("notifications.application_approved", { applicationId: "LKO-456" });
    expect(msg).toBe("Application LKO-456 has been approved.");

    // Test Hindi parameterized template
    act(() => {
      result.current.setLocale("hi");
    });
    msg = result.current.t("notifications.application_approved", { applicationId: "LKO-456" });
    expect(msg).toBe("आवेदन LKO-456 स्वीकृत कर दिया गया है।");
  });
});
