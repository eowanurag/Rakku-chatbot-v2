import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AiFallbackService {
  private readonly logger = new Logger(AiFallbackService.name);

  public handleAIFailure(error: any, language: 'en' | 'hi' | 'hinglish' = 'en'): { success: boolean; citizenSafe: boolean; message: string } {
    // 1. Log error internally with standard diagnostics
    const errMessage = error?.message || String(error);
    const errStatus = error?.response?.status || 'N/A';
    this.logger.error(`AI System Error caught [Status: ${errStatus}]: ${errMessage}`);
    
    // 2. Localized safe guidance templates (guaranteed free from API keys, Gemini, quota, rate limit, or stack trace keywords)
    const messages = {
      en: "👮 I can continue to assist you.\n\nSome advanced features are currently unavailable, but your complaint process will not be affected.",
      hi: "👮 मैं आपकी सहायता जारी रख सकता हूँ।\n\nकुछ उन्नत सुविधाएँ इस समय उपलब्ध नहीं हैं, लेकिन आपकी शिकायत प्रक्रिया प्रभावित नहीं होगी।",
      hinglish: "👮 Main aapki help continue rakh sakta hoon.\n\nKuch advanced features is time available nahi hain, par aapki complaint process affect nahi hogi."
    };

    const citizenMessage = messages[language] || messages.en;

    return {
      success: false,
      citizenSafe: true,
      message: citizenMessage
    };
  }
}
