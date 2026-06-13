"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import messageLibrary from "../message_library.json";

export type Language = "en" | "hi";

interface LanguageContextType {
  selectedLanguage: Language | null;
  changeLanguage: (lang: Language | null) => void;
  translate: (messageId: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check localStorage on mount
    const savedLang = localStorage.getItem("rakku_language") as Language | null;
    if (savedLang && ["en", "hi"].includes(savedLang)) {
      setSelectedLanguage(savedLang);
    }
    setIsLoaded(true);
  }, []);

  const changeLanguage = (lang: Language | null) => {
    setSelectedLanguage(lang);
    if (lang) {
      localStorage.setItem("rakku_language", lang);
    } else {
      localStorage.removeItem("rakku_language");
    }
  };

  const translate = (messageId: string): string => {
    const messages = messageLibrary.messages as Record<string, Record<string, string>>;
    const messageObj = messages[messageId];
    if (!messageObj) return messageId;
    return messageObj[selectedLanguage || "en"] || messageObj["en"] || messageId;
  };

  // Prevent rendering children until language is loaded from localStorage
  // This avoids hydration mismatch on first render
  if (!isLoaded) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ selectedLanguage, changeLanguage, translate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
