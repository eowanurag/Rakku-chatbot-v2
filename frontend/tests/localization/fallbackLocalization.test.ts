import { renderHook, act } from "@testing-library/react";
import { useTranslation } from "../../src/hooks/useTranslation";

describe("useTranslation Fallback Hierarchy", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should fall back to english or hinglish when key is missing in active locale", () => {
    const { result } = renderHook(() => useTranslation());
    
    // Switch to Hindi inside act
    act(() => {
      result.current.setLocale("hi");
    });
    
    // Call key that exists everywhere
    expect(result.current.t("welcome")).toBe("रक्कू नागरिक पोर्टल में आपका स्वागत है");

    // Call key that doesn't exist to verify complete fallback warning
    expect(result.current.t("nonexistent.key")).toBe("nonexistent.key");
  });
});
