export function getEmpathyMessage(message: string, lang: 'en' | 'hi' | 'hinglish'): string {
  const cleanMsg = message.toLowerCase();
  
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

  // Extract common items
  let itemEn = "property";
  let itemHi = "सामान";
  let itemHinglish = "property";

  const phoneKeys = ['phone', 'mobile', 'device', 'फ़ोन', 'मोबाइल', 'फोन'];
  const walletKeys = ['wallet', 'purse', 'money', 'cash', 'बटुआ', 'पर्स', 'पैसे'];
  const docKeys = ['document', 'documents', 'certificate', 'passport', 'card', 'aadhar', 'pan', 'दस्तावेज़', 'कागजात', 'कार्ड'];
  const bagKeys = ['bag', 'backpack', 'suitcase', 'थैला', 'बैग'];

  if (phoneKeys.some(k => cleanMsg.includes(k))) {
    itemEn = "phone";
    itemHi = "मोबाइल";
    itemHinglish = "phone";
  } else if (walletKeys.some(k => cleanMsg.includes(k))) {
    itemEn = "wallet";
    itemHi = "बटुआ / पर्स";
    itemHinglish = "wallet";
  } else if (docKeys.some(k => cleanMsg.includes(k))) {
    itemEn = "document";
    itemHi = "दस्तावेज़";
    itemHinglish = "document";
  } else if (bagKeys.some(k => cleanMsg.includes(k))) {
    itemEn = "bag";
    itemHi = "बैग";
    itemHinglish = "bag";
  }

  if (isTheft) {
    const servicesInfo = {
      en: "\n\n*Recommended Services:*\n- [🚔 File Complaint](option:🚔 File a Complaint)\n- [📱 Lost Article Report](option:Lost Article Report)\n- [📍 Nearest Police Station](option:nearest police station)\n\n",
      hi: "\n\n*अनुशंसित सेवाएं:*\n- [🚔 शिकायत दर्ज करें](option:🚔 File a Complaint)\n- [📱 खोई हुई वस्तु रिपोर्ट](option:Lost Article Report)\n- [📍 निकटतम पुलिस स्टेशन](option:nearest police station)\n\n",
      hinglish: "\n\n*Recommended Services:*\n- [🚔 File Complaint](option:🚔 File a Complaint)\n- [📱 Lost Article Report](option:Lost Article Report)\n- [📍 Nearest Police Station](option:nearest police station)\n\n",
    };
    if (lang === 'en') {
      return `I'm sorry to hear that your ${itemEn} was stolen.${servicesInfo.en}I'll help guide you through the complaint process.\n\n`;
    } else if (lang === 'hi') {
      return `मुझे यह सुनकर दुख हुआ कि आपका ${itemHi} चोरी हो गया है।${servicesInfo.hi}मैं शिकायत प्रक्रिया में आपका मार्गदर्शन करूँगा।\n\n`;
    } else {
      return `I'm sorry to hear that aapka ${itemHinglish} chori ho gaya hai.${servicesInfo.hinglish}Main complaint process mein aapki madad karunga.\n\n`;
    }
  }

  if (isLost) {
    if (lang === 'en') {
      return `I'm sorry that happened.\n\nI'll help you understand the next steps.\n\n`;
    } else if (lang === 'hi') {
      return `मुझे खेद है कि ऐसा हुआ।\n\nमैं आपको अगले कदम समझने में मदद करूँगा।\n\n`;
    } else {
      return `I'm sorry that happened.\n\nMain aapko next steps samajhne mein madad karunga.\n\n`;
    }
  }

  if (isHarassment) {
    if (lang === 'en') {
      return `I'm sorry to hear you're experiencing harassment. Your safety and peace of mind are important.\n\nI'll help guide you through the complaint process.\n\n`;
    } else if (lang === 'hi') {
      return `मुझे यह सुनकर खेद है कि आप उत्पीड़न का सामना कर रहे हैं। आपकी सुरक्षा और मानसिक शांति अत्यंत महत्वपूर्ण हैं।\n\nमैं शिकायत प्रक्रिया में आपका मार्गदर्शन करूँगा।\n\n`;
    } else {
      return `I'm sorry to hear you're facing harassment. Aapki safety kafi important hai.\n\nMain complaint process mein aapki madad karunga.\n\n`;
    }
  }

  if (isFraud) {
    if (lang === 'en') {
      return `I'm sorry to hear that you have been defrauded. Financial scams can be extremely stressful.\n\nI'll help guide you through the complaint process.\n\n`;
    } else if (lang === 'hi') {
      return `मुझे दुख है कि आपके साथ धोखाधड़ी हुई है। वित्तीय धोखाधड़ी बेहद तनावपूर्ण हो सकती है।\n\nमैं शिकायत प्रक्रिया में आपकी सहायता करूँगा।\n\n`;
    } else {
      return `I'm sorry to hear that aapke sath fraud hua hai. Financial scams kafi stressful ho sakte hain.\n\nMain complaint process mein aapki madad karunga.\n\n`;
    }
  }

  if (isDistress) {
    if (lang === 'en') {
      return `I understand this is a very difficult and stressful situation. Please remain calm, I am here to assist you.\n\n`;
    } else if (lang === 'hi') {
      return `मैं समझ सकता हूँ कि यह एक कठिन और तनावपूर्ण स्थिति है। कृपया शांत रहें, मैं यहाँ आपकी सहायता के लिए हूँ।\n\n`;
    } else {
      return `Main samajh sakta hoon ki yeh kafi difficult aur stressful situation hai. Please tension na lein, main aapki madad ke liye yahan hoon.\n\n`;
    }
  }

  return "";
}
