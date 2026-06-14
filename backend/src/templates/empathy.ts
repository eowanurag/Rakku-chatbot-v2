import { LocalizationService } from '../localization/localization.service';

export function getEmpathyMessage(message: string, lang: string, localizationService?: LocalizationService, sessionId?: string): string {
  const cleanMsg = message.toLowerCase();

  const isEmployee = cleanMsg.includes('employee') || cleanMsg.includes('कर्मचारी');
  const isTenant = cleanMsg.includes('tenant') || cleanMsg.includes('kirayedar') || cleanMsg.includes('किरायेदार') || cleanMsg.includes('rent') || cleanMsg.includes('pg') || cleanMsg.includes('domestic') || cleanMsg.includes('help') || cleanMsg.includes('satyapan') || cleanMsg.includes('सत्यापन');
  const isCharacter = cleanMsg.includes('character') || cleanMsg.includes('charitra') || cleanMsg.includes('चरित्र');

  if (localizationService) {
    if (isEmployee) {
      return localizationService.translate('EMPATHY_EMPLOYEE_VERIFICATION', lang, undefined, undefined, sessionId) + '\n\n';
    }
    if (isTenant) {
      return localizationService.translate('EMPATHY_TENANT_VERIFICATION', lang, undefined, undefined, sessionId) + '\n\n';
    }
    if (isCharacter) {
      return localizationService.translate('EMPATHY_CHARACTER_CERTIFICATE', lang, undefined, undefined, sessionId) + '\n\n';
    }
  }

  const theftKeys = ['stolen', 'theft', 'steal', 'chori', 'चोरी', 'चोर'];
  const lostKeys = ['lost', 'missing', 'gum', 'kho', 'खोया', 'खो', 'गुम', 'belost'];
  const harassKeys = ['harass', 'harassment', 'teasing', 'threat', 'trolling', 'pareshan', 'dhamki', 'उत्पीड़न', 'परेशान', 'धमकी'];
  const fraudKeys = ['fraud', 'scam', 'cheated', 'dhokha', 'cyber', 'धोखा', 'धोखाधड़ी', 'साइबर'];
  const distressKeys = ['distress', 'trouble', 'scared', 'worried', 'stressed', 'afraid', 'upset', 'rona', 'tention', 'darr', 'डर', 'तनाव', 'परेशान'];

  const isTheft = theftKeys.some(k => cleanMsg.includes(k));
  const isLost = lostKeys.some(k => cleanMsg.includes(k));
  const isHarassment = harassKeys.some(k => cleanMsg.includes(k));
  const isFraud = fraudKeys.some(k => cleanMsg.includes(k));
  const isDistress = distressKeys.some(k => cleanMsg.includes(k));

  const phoneKeys = ['phone', 'mobile', 'device', 'फ़ोन', 'मोबाइल', 'फोन'];
  const walletKeys = ['wallet', 'purse', 'money', 'cash', 'बटुआ', 'पर्स', 'पैसे'];
  const docKeys = ['document', 'documents', 'certificate', 'passport', 'card', 'aadhar', 'pan', 'दस्तावेज़', 'कागजात', 'कार्ड'];
  const bagKeys = ['bag', 'backpack', 'suitcase', 'थैला', 'बैग'];

  let itemType = 'PROPERTY';
  if (phoneKeys.some(k => cleanMsg.includes(k))) {
    itemType = 'PHONE';
  } else if (walletKeys.some(k => cleanMsg.includes(k))) {
    itemType = 'WALLET';
  } else if (docKeys.some(k => cleanMsg.includes(k))) {
    itemType = 'DOCUMENT';
  } else if (bagKeys.some(k => cleanMsg.includes(k))) {
    itemType = 'BAG';
  }

  if (localizationService) {
    if (isTheft) {
      const servicesInfo = localizationService.translate('RECOMMENDED_SERVICES_THEFT', lang, undefined, undefined, sessionId);
      return localizationService.translate(`EMPATHY_THEFT_${itemType}`, lang, { servicesInfo }, undefined, sessionId);
    }
    if (isLost) {
      return localizationService.translate('EMPATHY_LOST', lang, undefined, undefined, sessionId);
    }
    if (isHarassment) {
      return localizationService.translate('EMPATHY_HARASSMENT', lang, undefined, undefined, sessionId);
    }
    if (isFraud) {
      return localizationService.translate('EMPATHY_FRAUD', lang, undefined, undefined, sessionId);
    }
    if (isDistress) {
      return localizationService.translate('EMPATHY_DISTRESS', lang, undefined, undefined, sessionId);
    }
  }

  // Pure fallback if localization service is not available
  const messages = {
    en: {
      lost: "I'm sorry that happened.\n\nI'll help you understand the next steps.\n\n",
      harass: "I'm sorry to hear you're experiencing harassment. Your safety and peace of mind are important.\n\nI'll help guide you through the complaint process.\n\n",
      fraud: "I'm sorry to hear that you have been defrauded. Financial scams can be extremely stressful.\n\nI'll help guide you through the complaint process.\n\n",
      distress: "I understand this is a very difficult and stressful situation. Please remain calm, I am here to assist you.\n\n"
    },
    hi: {
      lost: "मुझे खेद है कि ऐसा हुआ।\n\nमैं आपको अगले कदम समझने में मदद करूँगा।\n\n",
      harass: "मुझे यह सुनकर खेद है कि आप उत्पीड़न का सामना कर रहे हैं। आपकी सुरक्षा और मानसिक शांति अत्यंत महत्वपूर्ण हैं।\n\nमैं शिकायत प्रक्रिया में आपका मार्गदर्शन करूँगा।\n\n",
      fraud: "मुझे दुख है कि आपके साथ धोखाधड़ी हुई है। वित्तीय धोखाधड़ी बेहद तनावपूर्ण हो सकती है।\n\nमैं शिकायत प्रक्रिया में आपकी सहायता करूँगा।\n\n",
      distress: "मैं समझ सकता हूँ कि यह एक कठिन और तनावपूर्ण स्थिति है। कृपया शांत रहें, मैं यहाँ आपकी सहायता के लिए हूँ।\n\n"
    },
    hinglish: {
      lost: "I'm sorry that happened.\n\nMain aapko next steps samajhne mein madad karunga.\n\n",
      harass: "I'm sorry to hear you're facing harassment. Aapki safety kafi important hai.\n\nMain complaint process mein aapki madad karunga.\n\n",
      fraud: "I'm sorry to hear that aapke sath fraud hua hai. Financial scams kafi stressful ho sakte hain.\n\nMain complaint process mein aapki madad karunga.\n\n",
      distress: "Main samajh sakta hoon ki yeh kafi difficult aur stressful situation hai. Please tension na lein, main aapki madad ke liye yahan hoon.\n\n"
    }
  };

  const l = (lang === 'hi' || lang === 'hinglish') ? lang : 'en';
  if (isLost) return messages[l].lost;
  if (isHarassment) return messages[l].harass;
  if (isFraud) return messages[l].fraud;
  if (isDistress) return messages[l].distress;

  return "";
}
