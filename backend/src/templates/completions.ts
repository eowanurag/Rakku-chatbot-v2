export function getCompletionMessage(refNum: string, lang: 'en' | 'hi' | 'hinglish'): string {
  const messages = {
    en: `✅ Your request has been recorded successfully.

Reference Number:
${refNum}

Please save this number for future tracking.

Is there anything else I can help you with today?`,
    hi: `✅ आपका अनुरोध सफलतापूर्वक दर्ज कर लिया गया है।

संदर्भ संख्या:
${refNum}

कृपया भविष्य में ट्रैकिंग के लिए इस नंबर को सुरक्षित रखें।

क्या मैं आज आपकी किसी और चीज़ में सहायता कर सकता हूँ?`,
    hinglish: `✅ Aapka request successfully record ho gaya hai.

Reference Number:
${refNum}

Please future tracking ke liye is number ko save kar lein.

Is there anything else I can help you with today?`
  };
  return messages[lang];
}

