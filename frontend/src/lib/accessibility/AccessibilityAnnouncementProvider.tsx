"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Announcements } from "./announcements";

interface AccessibilityContext {
  announce: (message: string, priority?: "polite" | "assertive") => void;
}

const AccessibilityContext = createContext<AccessibilityContext | undefined>(undefined);

export const AccessibilityAnnouncementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const announce = (message: string, priority?: "polite" | "assertive") => {
    Announcements.announce(message, priority);
  };

  useEffect(() => {
    // Mount the polite live announcer node instantly on body load
    announce("Rakku screen announcer active.");
  }, []);

  return (
    <AccessibilityContext.Provider value={{ announce }}>
      {children}
      <div id="rakku-live-announcer" className="sr-only" aria-live="polite" aria-atomic="true"></div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within AccessibilityAnnouncementProvider");
  }
  return context;
};
export default AccessibilityAnnouncementProvider;
