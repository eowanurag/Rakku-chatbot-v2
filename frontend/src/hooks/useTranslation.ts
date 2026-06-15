"use client";

import { useEffect, useState } from "react";
import { CONSTANTS } from "../config/constants";

// Import English namespaces
import enCommon from "../locales/en/common.json";
import enServices from "../locales/en/services.json";
import enTracking from "../locales/en/tracking.json";
import enWorkflows from "../locales/en/workflows.json";
import enNotifications from "../locales/en/notifications.json";
import enFeedback from "../locales/en/feedback.json";
import enEmergency from "../locales/en/emergency.json";

// Import Hindi namespaces
import hiCommon from "../locales/hi/common.json";
import hiServices from "../locales/hi/services.json";
import hiTracking from "../locales/hi/tracking.json";
import hiWorkflows from "../locales/hi/workflows.json";
import hiNotifications from "../locales/hi/notifications.json";
import hiFeedback from "../locales/hi/feedback.json";
import hiEmergency from "../locales/hi/emergency.json";

// Import Hinglish namespaces
import hinglishCommon from "../locales/hinglish/common.json";
import hinglishServices from "../locales/hinglish/services.json";
import hinglishTracking from "../locales/hinglish/tracking.json";
import hinglishWorkflows from "../locales/hinglish/workflows.json";
import hinglishNotifications from "../locales/hinglish/notifications.json";
import hinglishFeedback from "../locales/hinglish/feedback.json";
import hinglishEmergency from "../locales/hinglish/emergency.json";

type Locale = "en" | "hi" | "hinglish";

// Flatten and merge helper
function flattenKeys(obj: any, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof val === "object" && val !== null) {
        Object.assign(result, flattenKeys(val, newKey));
      } else {
        result[newKey] = String(val);
      }
    }
  }
  return result;
}

// Statically compile catalog dictionaries
const catalogs: Record<Locale, Record<string, string>> = {
  en: {
    ...flattenKeys(enCommon),
    ...flattenKeys(enServices, "services"),
    ...flattenKeys(enTracking, "tracking"),
    ...flattenKeys(enWorkflows, "workflows"),
    ...flattenKeys(enNotifications, "notifications"),
    ...flattenKeys(enFeedback, "feedback"),
    ...flattenKeys(enEmergency, "emergency"),
  },
  hi: {
    ...flattenKeys(hiCommon),
    ...flattenKeys(hiServices, "services"),
    ...flattenKeys(hiTracking, "tracking"),
    ...flattenKeys(hiWorkflows, "workflows"),
    ...flattenKeys(hiNotifications, "notifications"),
    ...flattenKeys(hiFeedback, "feedback"),
    ...flattenKeys(hiEmergency, "emergency"),
  },
  hinglish: {
    ...flattenKeys(hinglishCommon),
    ...flattenKeys(hinglishServices, "services"),
    ...flattenKeys(hinglishTracking, "tracking"),
    ...flattenKeys(hinglishWorkflows, "workflows"),
    ...flattenKeys(hinglishNotifications, "notifications"),
    ...flattenKeys(hinglishFeedback, "feedback"),
    ...flattenKeys(hinglishEmergency, "emergency"),
  },
};

// Fallback search sequence: hi -> hinglish -> en
const FALLBACK_SEQUENCE: Locale[] = ["hi", "hinglish", "en"];

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(CONSTANTS.LOCALES.DEFAULT as Locale);

  useEffect(() => {
    const savedLocale = localStorage.getItem(CONSTANTS.STORAGE_KEYS.USER_LOCALE) as Locale;
    if (savedLocale && (savedLocale === "en" || savedLocale === "hi" || savedLocale === "hinglish")) {
      setLocaleState(savedLocale);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    localStorage.setItem(CONSTANTS.STORAGE_KEYS.USER_LOCALE, newLocale);
    setLocaleState(newLocale);
    
    // Dynamically set document html lang attribute
    if (typeof document !== "undefined") {
      const langCode = newLocale === "hi" ? "hi" : "en";
      document.documentElement.setAttribute("lang", langCode);
    }

    // Trigger audible announcement for screen readers
    const { Announcements } = require("../lib/accessibility/announcements");
    const langLabel = newLocale === "en" ? "English" : newLocale === "hi" ? "Hindi" : "Hinglish";
    Announcements.announce(`Language changed to ${langLabel}`);

    window.dispatchEvent(new Event("storage"));
  };

  /**
   * Translates key paths and resolves parameterized dynamic interpolation.
   * Leverages fallback sequence: Active Locale -> hi -> hinglish -> en.
   */
  const t = (key: string, params?: Record<string, string | number>): string => {
    let rawTranslation: string | undefined;

    // 1. Try active selected locale first
    rawTranslation = catalogs[locale][key];

    // 2. Traversal fallback hierarchy: Active -> hi -> hinglish -> en
    if (rawTranslation === undefined) {
      console.warn(`[Locale Monitor] Missing key "${key}" in active locale "${locale}". Attempting fallback chain.`);
      
      const localeIndex = FALLBACK_SEQUENCE.indexOf(locale);
      const targets = FALLBACK_SEQUENCE.filter((_, idx) => idx !== localeIndex);
      
      for (const fallback of targets) {
        if (catalogs[fallback][key] !== undefined) {
          rawTranslation = catalogs[fallback][key];
          console.warn(`[Locale Monitor] Key "${key}" recovered via fallback locale "${fallback}".`);
          break;
        }
      }
    }

    // 3. Complete fallback failure
    if (rawTranslation === undefined) {
      console.error(`[Locale Monitor] Translation key "${key}" is completely missing across all catalogs.`);
      return key;
    }

    // 4. Parameter interpolation: {{variableName}}
    if (params) {
      let interpolated = rawTranslation;
      for (const pKey in params) {
        if (Object.prototype.hasOwnProperty.call(params, pKey)) {
          const val = String(params[pKey]);
          interpolated = interpolated.replace(new RegExp(`{{\\s*${pKey}\\s*}}`, "g"), val);
        }
      }
      return interpolated;
    }

    return rawTranslation;
  };

  return {
    locale,
    setLocale,
    t,
  };
}
