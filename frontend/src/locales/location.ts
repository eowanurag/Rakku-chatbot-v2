export interface LocationLocaleMap {
  en: string;
  hi: string;
  hinglish: string;
}

export const LOCATION_DICTIONARY: Record<string, LocationLocaleMap> = {
  // State Codes
  "ST_UP": {
    en: "Uttar Pradesh",
    hi: "उत्तर प्रदेश",
    hinglish: "Uttar Pradesh",
  },
  // District Codes
  "DIST_LKO": {
    en: "Lucknow",
    hi: "लखनऊ",
    hinglish: "Lucknow",
  },
  "DIST_KNP": {
    en: "Kanpur",
    hi: "कानपुर",
    hinglish: "Kanpur",
  },
  // Tehsil Codes
  "TEH_LKO_SADAR": {
    en: "Lucknow Sadar",
    hi: "लखनऊ सदर",
    hinglish: "Lucknow Sadar",
  },
  // Block Codes
  "BLK_CHINHAT": {
    en: "Chinhat",
    hi: "चिनहट",
    hinglish: "Chinhat",
  },
  // Village Codes
  "VIL_DEVA": {
    en: "Deva Village",
    hi: "देवा ग्राम",
    hinglish: "Deva Village",
  },
  // Police Station Codes
  "PS_HAZRATGANJ": {
    en: "Hazratganj Police Station",
    hi: "हज़रतगंज कोतवाली",
    hinglish: "Hazratganj Kotwali",
  },
  "PS_CHINHAT": {
    en: "Chinhat Police Station",
    hi: "चिनहट थाना",
    hinglish: "Chinhat Thana",
  },
};

/**
 * Resolves location administrative codes to active locale strings client-side.
 */
export function tLocation(code: string, locale: "en" | "hi" | "hinglish" = "hi"): string {
  const mapping = LOCATION_DICTIONARY[code];
  if (!mapping) {
    console.warn(`[Location Monitor] Unknown location code "${code}". Returning raw string.`);
    return code;
  }
  return mapping[locale] || mapping["en"];
}
