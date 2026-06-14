import { LocalizationService } from '../localization/localization.service';

export function getEmergencyMessage(lang: string, localizationService?: LocalizationService): string {
  if (localizationService) {
    return localizationService.translate('EMERGENCY_MESSAGE', lang);
  }
  
  const messages = {
    en: `⚠️ This appears to be an emergency situation.

Please contact UP Police Emergency Services immediately by dialing 112.

If someone is in immediate danger, do not wait for an online response.`,
    hi: `⚠️ यह एक आपातकालीन स्थिति लगती है।

कृपया तुरंत 112 डायल करके उत्तर प्रदेश पुलिस आपातकालीन सेवाओं से संपर्क करें।

यदि कोई तत्काल खतरे में है, तो ऑनलाइन प्रतिक्रिया की प्रतीक्षा न करें।`,
    hinglish: `⚠️ Yeh emergency situation lag rahi hai.

Please immediate help ke liye UP Police ko 112 dial karke contact karein.

Agar koi immediate danger mein hai, toh online response ka wait na karein.`
  };
  return messages[lang as 'en' | 'hi' | 'hinglish'] || messages['en'];
}
