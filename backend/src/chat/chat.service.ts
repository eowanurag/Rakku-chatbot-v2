import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ComplaintService } from '../complaint/complaint.service';
import { VerificationService } from '../verification/verification.service';
import { CertificateService } from '../certificate/certificate.service';
import { EventService } from '../event/event.service';
import { TrackingService } from '../tracking/tracking.service';
import { WELCOME_MESSAGE, LANGUAGE_SELECTION_RESPONSES } from '../templates/greetings';
import { getEmpathyMessage } from '../templates/empathy';
import { getCompletionMessage } from '../templates/completions';
import { getEmergencyMessage } from '../templates/emergency';
import { AnalyticsService } from '../citizen-assistance/analytics.service';

interface ChatSessionState {
  workflow: 'complaint' | 'verification' | 'certificate' | 'event' | 'tracking' | null;
  step: number;
  data: Record<string, any>;
  language: 'en' | 'hi' | 'hinglish';
  languageSelected?: boolean;
}

const TRANSLATIONS = {
  en: {
    cancel: "Current request has been cancelled. How else can I assist you?",
    invalidStep: "I couldn't understand that. Let's restart the workflow.",
    upcopApp: "\n\n*Need more official services? Download the official **UPCOP Mobile App** from the [Google Play Store](https://play.google.com/store/apps/details?id=com.up.uppolice) to access 27+ citizen services directly.*",
  },
  hi: {
    cancel: "वर्तमान अनुरोध रद्द कर दिया गया है। मैं आपकी और क्या सहायता कर सकता हूँ?",
    invalidStep: "मुझे समझ नहीं आया। फिर से प्रयास करते हैं।",
    upcopApp: "\n\n*अधिक आधिकारिक सेवाओं के लिए, कृपया [गूगल प्ले स्टोर](https://play.google.com/store/apps/details?id=com.up.uppolice) से आधिकारिक **UPCOP मोबाइल ऐप** डाउनलोड करें।* ",
  },
  hinglish: {
    cancel: "Request cancel kar di gayi hai. Aapko aur kis cheez me help chahiye?",
    invalidStep: "Mujhe samajh nahi aaya. Fir se try karte hain.",
    upcopApp: "\n\n*Baaki official services ke liye, official **UPCOP App** download karein: [Google Play Store](https://play.google.com/store/apps/details?id=com.up.uppolice).* ",
  },
};

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private aiServiceUrl: string;

  // In-memory session store for local fallback
  private sessions: Map<string, ChatSessionState> = new Map();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly complaintService: ComplaintService,
    private readonly verificationService: VerificationService,
    private readonly certificateService: CertificateService,
    private readonly eventService: EventService,
    private readonly trackingService: TrackingService,
    private readonly analyticsService: AnalyticsService,
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
  }

  async sendMessage(message: string, sessionId: string): Promise<{ response: string; suggestions?: string[] }> {
    this.analyticsService.trackHelpRequest();
    try {
      this.logger.log(`Forwarding message to FastAPI AI service: ${this.aiServiceUrl}/chat/message`);
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/chat/message`, {
          message,
          session_id: sessionId,
        }),
      );
      
      const responseData = response.data;
      if (responseData && responseData.db_action) {
        await this.executeDbAction(responseData.db_action);
      }

      if (responseData && responseData.response) {
        const text = responseData.response;
        if (text.includes('112')) this.analyticsService.trackHelplineRecommendation('112');
        if (text.includes('1090')) this.analyticsService.trackHelplineRecommendation('1090');
        if (text.includes('1930')) this.analyticsService.trackHelplineRecommendation('1930');
        if (text.includes('1098')) this.analyticsService.trackHelplineRecommendation('1098');
        if (text.includes('108')) this.analyticsService.trackHelplineRecommendation('108');
        if (text.includes('101')) this.analyticsService.trackHelplineRecommendation('101');
        
        if (text.includes('EMERGENCY') || text.includes('Notice') || text.includes('आपातकालीन')) {
          this.analyticsService.trackEmergencyOverride();
        }
      }
      
      return responseData;
    } catch (e) {
      this.logger.warn(`AI Service connection failed (${e.message}). Initializing local rule-based mock workflow engine.`);
      return this.handleLocalFallback(message, sessionId);
    }
  }

  private async executeDbAction(dbAction: { type: string; data: Record<string, any> }) {
    try {
      this.logger.log(`Executing DB Action from AI service: ${dbAction.type}`);
      switch (dbAction.type) {
        case 'complaint':
          await this.complaintService.createComplaint(
            dbAction.data.type,
            dbAction.data.details,
            dbAction.data.refNum
          );
          break;
        case 'verification':
          await this.verificationService.createVerification(
            dbAction.data.type,
            dbAction.data.name,
            dbAction.data.address,
            dbAction.data.mobile,
            dbAction.data.propertyDetails,
            dbAction.data.refNum
          );
          break;
        case 'certificate':
          await this.certificateService.createCertificate(
            dbAction.data.name,
            dbAction.data.address,
            dbAction.data.district,
            dbAction.data.purpose,
            dbAction.data.refNum
          );
          break;
        case 'event':
          await this.eventService.createEventPermission(
            dbAction.data.type,
            dbAction.data.name,
            dbAction.data.location,
            dbAction.data.date,
            dbAction.data.attendance,
            dbAction.data.refNum
          );
          break;
      }
    } catch (error) {
      this.logger.error(`Failed to execute DB action: ${error.message}`);
    }
  }

  private async handleLocalFallback(message: string, sessionId: string): Promise<{ response: string; suggestions?: string[] }> {
    const cleanMsg = message.trim().toLowerCase();

    // Initialize session if not exists
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        workflow: null,
        step: 0,
        data: {},
        language: 'en',
        languageSelected: false,
      });
    }

    const session = this.sessions.get(sessionId)!;

    // 1. Emergency Checks (overrides active workflow)
    const emergencyKeywords = [
      'danger', 'assault', 'threat', 'life', 'weapon', 'murder', 'burglar', 'attack', 'emergency',
      'मदद', 'खतरा', 'हमला', 'kidnapping', 'burglary', 'ongoing attack', 'burglary in progress', 'immediate danger'
    ];
    if (emergencyKeywords.some(keyword => cleanMsg.includes(keyword))) {
      session.workflow = null;
      session.step = 0;
      session.data = {};
      return {
        response: getEmergencyMessage(session.language),
        suggestions: ['🚔 File a Complaint', '🔍 Track Status'],
      };
    }

    // Check if language selection is happening
    if (!session.languageSelected) {
      let matchedLang = false;
      if (cleanMsg === 'english' || cleanMsg.includes('option:english')) {
        session.language = 'en';
        session.languageSelected = true;
        matchedLang = true;
      } else if (cleanMsg === 'हिंदी' || cleanMsg.includes('hindi') || cleanMsg.includes('option:हिंदी') || cleanMsg.includes('option:हिंदी (hindi)')) {
        session.language = 'hi';
        session.languageSelected = true;
        matchedLang = true;
      } else if (cleanMsg === 'hinglish' || cleanMsg.includes('option:hinglish')) {
        session.language = 'hinglish';
        session.languageSelected = true;
        matchedLang = true;
      }

      if (matchedLang) {
        this.analyticsService.trackLanguage(session.language);
        return {
          response: LANGUAGE_SELECTION_RESPONSES[session.language],
          suggestions: ['🚔 File a Complaint', '🏠 Tenant Verification', '📜 Character Certificate', '🎭 Event Permission', '🔍 Track Application'],
        };
      }

      // If it is a free-text message (e.g. from examples), check if it starts a workflow
      let detectedLang: 'en' | 'hi' | 'hinglish' = 'en';
      if (/[\u0900-\u097F]/.test(cleanMsg) || cleanMsg.includes('हिन्दी') || cleanMsg.includes('hindi') || cleanMsg.includes('हिंदी')) {
        detectedLang = 'hi';
      } else if (cleanMsg.includes('hinglish') || cleanMsg.includes('karna') || cleanMsg.includes('chahiye') || cleanMsg.includes('chori') || cleanMsg.includes('gum') || cleanMsg.includes('shikayat')) {
        detectedLang = 'hinglish';
      }

      const startsWorkflow = cleanMsg.includes('complaint') || cleanMsg.includes('stolen') || cleanMsg.includes('shikayat') || cleanMsg.includes('चोरी') || cleanMsg.includes('शिकायत') || cleanMsg.includes('lost') || cleanMsg.includes('wallet') || cleanMsg.includes('pocket') ||
                             cleanMsg.includes('tenant') || cleanMsg.includes('verification') || cleanMsg.includes('satyapan') || cleanMsg.includes('किरायेदार') || cleanMsg.includes('सत्यापन') ||
                             cleanMsg.includes('certificate') || cleanMsg.includes('character') || cleanMsg.includes('charitra') || cleanMsg.includes('चरित्र') || cleanMsg.includes('प्रमाण') ||
                             cleanMsg.includes('event') || cleanMsg.includes('permission') || cleanMsg.includes('protest') || cleanMsg.includes('shooting') || cleanMsg.includes('अनुमति') ||
                             cleanMsg.includes('track') || cleanMsg.includes('status') || cleanMsg.includes('pata karein') || cleanMsg.includes('स्थिति');

      if (startsWorkflow) {
        session.language = detectedLang;
        session.languageSelected = true;
        this.analyticsService.trackLanguage(session.language);
      } else {
        return {
          response: WELCOME_MESSAGE,
          suggestions: ['English', 'हिंदी', 'Hinglish'],
        };
      }
    }

    const lang = session.language;

    // Cancel command
    if (cleanMsg === 'cancel' || cleanMsg === 'radd' || cleanMsg === 'रद्द' || cleanMsg === 'exit') {
      session.workflow = null;
      session.step = 0;
      session.data = {};
      return {
        response: TRANSLATIONS[lang].cancel,
        suggestions: ['🚔 File a Complaint', '🏠 Tenant Verification', '📜 Character Certificate', '🎭 Event Permission', '🔍 Track Application'],
      };
    }

    // 2. Manage Active Workflows
    if (session.workflow) {
      let empathyPrepend = "";
      if (message && !session.data.empathyShown) {
        empathyPrepend = getEmpathyMessage(message, lang);
        if (empathyPrepend) {
          session.data.empathyShown = true;
        }
      }

      let res: { response: string; suggestions?: string[] };
      switch (session.workflow) {
        case 'complaint':
          res = this.runComplaintWorkflow(session, message);
          break;
        case 'verification':
          res = this.runVerificationWorkflow(session, message);
          break;
        case 'certificate':
          res = this.runCertificateWorkflow(session, message);
          break;
        case 'event':
          res = this.runEventWorkflow(session, message);
          break;
        case 'tracking':
          res = await this.runTrackingWorkflow(session, message);
          break;
        default:
          res = { response: TRANSLATIONS[lang].invalidStep };
      }

      if (empathyPrepend && res) {
        res.response = empathyPrepend + res.response;
      }
      return res;
    }

    // 3. Detect Intent & Start Workflows
    let empathyPrepend = getEmpathyMessage(message, lang);

    if (cleanMsg.includes('complaint') || cleanMsg.includes('stolen') || cleanMsg.includes('shikayat') || cleanMsg.includes('चोरी') || cleanMsg.includes('शिकायत') || cleanMsg.includes('lost') || cleanMsg.includes('wallet') || cleanMsg.includes('pocket')) {
      session.workflow = 'complaint';
      session.data = {};
      
      // Auto-detect type
      let autoType = '';
      if (cleanMsg.includes('phone') || cleanMsg.includes('mobile') || cleanMsg.includes('stolen') || cleanMsg.includes('theft') || cleanMsg.includes('chori') || cleanMsg.includes('फ़ोन') || cleanMsg.includes('मोबाइल') || cleanMsg.includes('फोन') || cleanMsg.includes('चोरी') || cleanMsg.includes('चोर')) {
        autoType = 'Lost Mobile / Theft';
      } else if (cleanMsg.includes('document') || cleanMsg.includes('wallet') || cleanMsg.includes('passport') || cleanMsg.includes('card') || cleanMsg.includes('aadhar') || cleanMsg.includes('दस्तावेज़') || cleanMsg.includes('कागजात') || cleanMsg.includes('गुम') || cleanMsg.includes('खोया') || cleanMsg.includes('बटुआ') || cleanMsg.includes('पर्स')) {
        autoType = 'Lost Document';
      } else if (cleanMsg.includes('harass') || cleanMsg.includes('teasing') || cleanMsg.includes('threat') || cleanMsg.includes('उत्पीड़न') || cleanMsg.includes('परेशान') || cleanMsg.includes('धमकी') || cleanMsg.includes('pareshan') || cleanMsg.includes('dhamki')) {
        autoType = 'Simple Harassment';
      } else if (cleanMsg.includes('fraud') || cleanMsg.includes('scam') || cleanMsg.includes('money') || cleanMsg.includes('dhokha') || cleanMsg.includes('धोखा') || cleanMsg.includes('धोखाधड़ी') || cleanMsg.includes('पैसा') || cleanMsg.includes('पैसे')) {
        autoType = 'Cyber Fraud / Financial Loss';
      }

      if (autoType) {
        session.data.type = autoType;
        session.step = 2; // Directly go to asking details (location)
        const nextQ = this.runComplaintWorkflow(session, "");
        return {
          response: empathyPrepend + nextQ.response,
          suggestions: nextQ.suggestions,
        };
      }

      session.step = 1;
      const nextQ = this.runComplaintWorkflow(session, "");
      return {
        response: empathyPrepend + nextQ.response,
        suggestions: nextQ.suggestions,
      };
    }

    if (cleanMsg.includes('tenant') || cleanMsg.includes('verification') || cleanMsg.includes('satyapan') || cleanMsg.includes('किरायेदार') || cleanMsg.includes('सत्यापन')) {
      session.workflow = 'verification';
      session.step = 1;
      session.data = {};
      const nextQ = this.runVerificationWorkflow(session, "");
      
      const recServices = {
        en: "*Recommended Services:*\n- [🏠 Tenant Verification](option:🏠 Tenant Verification)\n- [🔍 Application Tracking](option:🔍 Track Application)\n\n",
        hi: "*अनुशंसित सेवाएं:*\n- [🏠 किरायेदार सत्यापन](option:🏠 Tenant Verification)\n- [🔍 आवेदन ट्रैकिंग](option:🔍 Track Application)\n\n",
        hinglish: "*Recommended Services:*\n- [🏠 Tenant Verification](option:🏠 Tenant Verification)\n- [🔍 Application Tracking](option:🔍 Track Application)\n\n"
      };

      return {
        response: recServices[lang] + empathyPrepend + nextQ.response,
        suggestions: nextQ.suggestions,
      };
    }

    if (cleanMsg.includes('certificate') || cleanMsg.includes('character') || cleanMsg.includes('charitra') || cleanMsg.includes('चरित्र') || cleanMsg.includes('प्रमाण')) {
      session.workflow = 'certificate';
      session.step = 1;
      session.data = {};
      const nextQ = this.runCertificateWorkflow(session, "");
      return {
        response: empathyPrepend + nextQ.response,
        suggestions: nextQ.suggestions,
      };
    }

    if (cleanMsg.includes('event') || cleanMsg.includes('permission') || cleanMsg.includes('protest') || cleanMsg.includes('shooting') || cleanMsg.includes('अनुमति')) {
      session.workflow = 'event';
      session.step = 1;
      session.data = {};
      const nextQ = this.runEventWorkflow(session, "");
      return {
        response: empathyPrepend + nextQ.response,
        suggestions: nextQ.suggestions,
      };
    }

    if (cleanMsg.includes('track') || cleanMsg.includes('status') || cleanMsg.includes('pata karein') || cleanMsg.includes('स्थिति')) {
      session.workflow = 'tracking';
      session.step = 1;
      session.data = {};
      const nextQ = await this.runTrackingWorkflow(session, "");
      return {
        response: empathyPrepend + nextQ.response,
        suggestions: nextQ.suggestions,
      };
    }

    // 4. Q&A and FAQ Knowledge base fallback
    const faqList = [
      {
        keys: ['postmortem', 'post mortem', 'pm report', 'पोस्टमार्टम'],
        response: '🔬 **Postmortem Report Request Procedure:**\nTo obtain a postmortem report in Uttar Pradesh:\n1. Apply at the district Chief Medical Officer (CMO) office.\n2. Submit a request letter indicating the relationship to the deceased, along with copy of FIR/Panchnama and death certificate.\n3. The report is typically issued to close relatives after official verification.\n*(Note: Rakku assists in guidance, but actual reports are issued offline by CMO office).*',
      },
      {
        keys: ['police services', 'what do you do', 'services', 'help', 'मदद', 'सुविधाएं'],
        response: '👮 **UP Police Citizen Services:**\nThrough our online portal, citizens can access:\n- FIR Lodging (E-FIR for unknown/lost articles)\n- Character Verification\n- Tenant/PG/Domestic Help Verification\n- Domestic Help Verification\n- Event/Protest/Procession permissions\n- Missing Person Reporting\n\nLet me know which service you are interested in, and I can guide you through the process.',
      },
      {
        keys: ['faq', 'questions', 'how to', 'help'],
        response: '❓ **Common Frequently Asked Questions (FAQs):**\n- **How to file an FIR?** Visit the nearest Police Station or file an e-FIR on the UPCOP app for lost items.\n- **How long does character verification take?** Usually 15-21 days depending on police field verification.\n- **Is tenant verification mandatory?** Yes, as per district administration directives, tenant verification is mandatory to prevent security risks.',
      },
    ];

    for (const faq of faqList) {
      if (faq.keys.some(k => cleanMsg.includes(k))) {
        return {
          response: faq.response,
          suggestions: ['🚔 File a Complaint', '🏠 Tenant Verification', '📜 Character Certificate', '🔍 Track Application'],
        };
      }
    }

    // Default Greeting
    return {
      response: WELCOME_MESSAGE,
      suggestions: ['English', 'हिंदी', 'Hinglish'],
    };
  }

  // --- Complaint Workflow ---
  private runComplaintWorkflow(session: ChatSessionState, msg: string): { response: string; suggestions?: string[] } {
    const step = session.step;
    const lang = session.language;

    const prompts = {
      en: [
        "Please select the **Complaint Type**:\n\n- [Lost Mobile / Theft](option:Lost Mobile / Theft)\n- [Lost Document](option:Lost Document)\n- [Simple Harassment](option:Simple Harassment)\n- [Cyber Fraud / Financial Loss](option:Cyber Fraud / Financial Loss)",
        "Could you please tell me where the incident occurred?",
        "Thank you. Could you also tell me when did the incident occur (date and time)?",
        "Got it. Could you briefly describe what happened?",
      ],
      hi: [
        "कृपया **शिकायत का प्रकार** चुनें:\n\n- [मोबाइल चोरी / गुम होना](option:Lost Mobile / Theft)\n- [खोया हुआ दस्तावेज़](option:Lost Document)\n- [सामान्य उत्पीड़न](option:Simple Harassment)\n- [साइबर धोखाधड़ी](option:Cyber Fraud / Financial Loss)",
        "क्या आप कृपया बता सकते हैं कि घटना कहाँ हुई थी?",
        "धन्यवाद। क्या आप यह भी बता सकते हैं कि घटना कब (दिनांक और समय) हुई थी?",
        "समझ गया। क्या आप संक्षेप में बता सकते हैं कि क्या हुआ था?",
      ],
      hinglish: [
        "Please select the **Complaint Type**:\n\n- [Lost Mobile / Theft](option:Lost Mobile / Theft)\n- [Lost Document](option:Lost Document)\n- [Simple Harassment](option:Simple Harassment)\n- [Cyber Fraud / Financial Loss](option:Cyber Fraud / Financial Loss)",
        "Kya aap please bata sakte hain ki incident kahan hua tha?",
        "Thank you. Kya aap bata sakte hain ki incident kab (date aur time) hua?",
        "Got it. Kya aap short mein describe kar sakte hain ki kya hua tha?",
      ],
    };

    if (step === 1) {
      session.step = 2;
      return {
        response: prompts[lang][0],
        suggestions: ['Lost Mobile / Theft', 'Lost Document', 'Simple Harassment', 'Cyber Fraud / Financial Loss'],
      };
    }

    if (step === 2) {
      if (msg) session.data.type = msg;
      session.step = 3;
      return {
        response: prompts[lang][1],
      };
    }

    if (step === 3) {
      session.data.location = msg;
      session.step = 4;
      return {
        response: prompts[lang][2],
      };
    }

    if (step === 4) {
      session.data.time = msg;
      session.step = 5;
      return {
        response: prompts[lang][3],
      };
    }

    if (step === 5) {
      session.data.description = msg;
      session.workflow = null;
      session.step = 0;

      const fullDetails = `Location: ${session.data.location} | Date/Time: ${session.data.time} | Description: ${session.data.description}`;

      // Call service
      const resNum = `UP-CMP-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      this.complaintService.createComplaint(session.data.type, fullDetails, resNum);

      return {
        response: getCompletionMessage(resNum, lang),
        suggestions: ['🚔 File a Complaint', '🏠 Tenant Verification', '🔍 Track Status'],
      };
    }

    return { response: TRANSLATIONS[lang].invalidStep };
  }

  // --- Verification Workflow ---
  private runVerificationWorkflow(session: ChatSessionState, msg: string): { response: string; suggestions?: string[] } {
    const step = session.step;
    const lang = session.language;

    const prompts = {
      en: [
        "Please select the **Verification Type**:\n\n- [Tenant Verification](option:Tenant Verification)\n- [PG Verification](option:PG Verification)\n- [Domestic Help Verification](option:Domestic Help Verification)\n- [Employee Verification](option:Employee Verification)",
        "Let's start with their full name. What is their full name?",
        "Thank you. What is the permanent address of the person being verified?",
        "Got it. Could you please share their mobile number?",
        "Thank you. Could you also provide the property details (such as flat number, block, and city) where they will reside?",
      ],
      hi: [
        "कृपया **सत्यापन का प्रकार** चुनें:\n\n- [किरायेदार सत्यापन](option:Tenant Verification)\n- [पीजी सत्यापन](option:PG Verification)\n- [घरेलू सहायक सत्यापन](option:Domestic Help Verification)\n- [कर्मचारी सत्यापन](option:Employee Verification)",
        "चलिए उनके पूरे नाम से शुरू करते हैं। उनका पूरा नाम क्या है?",
        "धन्यवाद। सत्यापित किए जाने वाले व्यक्ति का स्थायी पता क्या है?",
        "ठीक है। क्या आप कृपया उनका मोबाइल नंबर साझा कर सकते हैं?",
        "धन्यवाद। क्या आप उस संपत्ति का विवरण (जैसे फ्लैट नंबर, ब्लॉक और शहर) भी दे सकते हैं जहाँ वे रहेंगे?",
      ],
      hinglish: [
        "Please select the **Verification Type**:\n\n- [Tenant Verification](option:Tenant Verification)\n- [PG Verification](option:PG Verification)\n- [Domestic Help Verification](option:Domestic Help Verification)\n- [Employee Verification](option:Employee Verification)",
        "Let's start with their full name. Unka full name kya hai?",
        "Thank you. Satyapit hone wale vyakti ka permanent address kya hai?",
        "Got it. Kya aap unka mobile number share karenge?",
        "Thank you. Kya aap property details (jaise flat number, block, city) batayenge jahan wo rahenge?",
      ],
    };

    if (step === 1) {
      session.step = 2;
      return {
        response: prompts[lang][0],
        suggestions: ['Tenant Verification', 'PG Verification', 'Domestic Help Verification', 'Employee Verification'],
      };
    }

    if (step === 2) {
      if (msg) session.data.type = msg;
      session.step = 3;
      return { response: prompts[lang][1] };
    }

    if (step === 3) {
      session.data.name = msg;
      session.step = 4;
      return { response: prompts[lang][2] };
    }

    if (step === 4) {
      session.data.address = msg;
      session.step = 5;
      return { response: prompts[lang][3] };
    }

    if (step === 5) {
      session.data.mobile = msg;
      session.step = 6;
      return { response: prompts[lang][4] };
    }

    if (step === 6) {
      session.data.propertyDetails = msg;
      session.workflow = null;
      session.step = 0;

      const resNum = `UP-VER-2026-${Math.floor(100000 + Math.random() * 900000)}`;

      // Save to database/mock service
      this.verificationService.createVerification(
        session.data.type,
        session.data.name,
        session.data.address,
        session.data.mobile,
        session.data.propertyDetails,
        resNum
      );

      return {
        response: getCompletionMessage(resNum, lang),
        suggestions: ['🚔 File a Complaint', '🏠 Tenant Verification', '🔍 Track Status'],
      };
    }

    return { response: 'Invalid step' };
  }

  // --- Character Certificate Workflow ---
  private runCertificateWorkflow(session: ChatSessionState, msg: string): { response: string; suggestions?: string[] } {
    const step = session.step;
    const lang = session.language;

    const prompts = {
      en: [
        "Let's start with your full name. What is your full name?",
        "Thank you. What is your permanent address?",
        "Got it. Which district in Uttar Pradesh are you applying from?",
        "Thank you. What is the purpose of this certificate?",
      ],
      hi: [
        "चलिए आपके पूरे नाम से शुरू करते हैं। आपका पूरा नाम क्या है?",
        "धन्यवाद। आपका स्थायी पता क्या है?",
        "ठीक है। आप उत्तर प्रदेश के किस ज़िले से आवेदन कर रहे हैं?",
        "धन्यवाद। इस प्रमाण पत्र का उद्देश्य क्या है?",
      ],
      hinglish: [
        "Let's start with your full name. Aapka full name kya hai?",
        "Thank you. Aapka permanent address kya hai?",
        "Got it. Aap Uttar Pradesh ke kis district se apply kar rahe hain?",
        "Thank you. Is certificate ka purpose kya hai?",
      ],
    };

    if (step === 1) {
      session.step = 2;
      return { response: prompts[lang][0] };
    }

    if (step === 2) {
      session.data.name = msg;
      session.step = 3;
      return { response: prompts[lang][1] };
    }

    if (step === 3) {
      session.data.address = msg;
      session.step = 4;
      return {
        response: prompts[lang][2],
        suggestions: ['Lucknow', 'Kanpur', 'Noida', 'Ghaziabad', 'Varanasi', 'Prayagraj'],
      };
    }

    if (step === 4) {
      session.data.district = msg;
      session.step = 5;
      return { response: prompts[lang][3] };
    }

    if (step === 5) {
      session.data.purpose = msg;
      session.workflow = null;
      session.step = 0;

      const resNum = `UP-CER-2026-${Math.floor(100000 + Math.random() * 900000)}`;

      // Save database
      this.certificateService.createCertificate(
        session.data.name,
        session.data.address,
        session.data.district,
        session.data.purpose,
        resNum
      );

      return {
        response: getCompletionMessage(resNum, lang),
        suggestions: ['🚔 File a Complaint', '🏠 Tenant Verification', '🔍 Track Status'],
      };
    }

    return { response: 'Invalid step' };
  }

  // --- Event Permission Workflow ---
  private runEventWorkflow(session: ChatSessionState, msg: string): { response: string; suggestions?: string[] } {
    const step = session.step;
    const lang = session.language;

    const prompts = {
      en: [
        "Please select the **Request Type**:\n\n- [Event Permission](option:Event Permission)\n- [Procession Request](option:Procession Request)\n- [Protest Request](option:Protest Request)\n- [Film Shooting Request](option:Film Shooting Request)",
        "Let's start with the event name. What is the name of your event?",
        "Thank you. Could you also tell me where the event will take place (location or route)?",
        "Got it. On what date is the event scheduled (DD/MM/YYYY)?",
        "Thank you. Could you tell me what the expected attendance number is?",
      ],
      hi: [
        "कृपया **अनुरोध का प्रकार** चुनें:\n\n- [कार्यक्रम अनुमति](option:Event Permission)\n- [जुलूस अनुमति](option:Procession Request)\n- [विरोध प्रदर्शन](option:Protest Request)\n- [फिल्म शूटिंग](option:Film Shooting Request)",
        "चलिए कार्यक्रम के नाम से शुरू करते हैं। आपके कार्यक्रम का नाम क्या है?",
        "धन्यवाद। क्या आप बता सकते हैं कि कार्यक्रम कहाँ (स्थान या मार्ग) आयोजित होगा?",
        "ठीक है। कार्यक्रम किस तिथि (DD/MM/YYYY) को निर्धारित है?",
        "धन्यवाद। क्या आप बता सकते हैं कि कार्यक्रम में संभावित उपस्थिति संख्या कितनी है?",
      ],
      hinglish: [
        "Please select the **Request Type**:\n\n- [Event Permission](option:Event Permission)\n- [Procession Request](option:Procession Request)\n- [Protest Request](option:Protest Request)\n- [Film Shooting Request](option:Film Shooting Request)",
        "Event ke naam se shuru karte hain. Aapke event ka naam kya hai?",
        "Thank you. Event kahan (location/route) hone wala hai?",
        "Got it. Event kis date (DD/MM/YYYY) ko hone wala hai?",
        "Thank you. Event mein kitne logon ke aane ki ummeed hai?",
      ],
    };

    if (step === 1) {
      session.step = 2;
      return {
        response: prompts[lang][0],
        suggestions: ['Event Permission', 'Procession Request', 'Protest Request', 'Film Shooting Request'],
      };
    }

    if (step === 2) {
      if (msg) session.data.type = msg;
      session.step = 3;
      return { response: prompts[lang][1] };
    }

    if (step === 3) {
      session.data.name = msg;
      session.step = 4;
      return { response: prompts[lang][2] };
    }

    if (step === 4) {
      session.data.location = msg;
      session.step = 5;
      return { response: prompts[lang][3] };
    }

    if (step === 5) {
      session.data.date = msg;
      session.step = 6;
      return { response: prompts[lang][4] };
    }

    if (step === 6) {
      session.data.attendance = parseInt(msg) || 100;
      session.workflow = null;
      session.step = 0;

      const resNum = `UP-EVP-2026-${Math.floor(100000 + Math.random() * 900000)}`;

      // Save database
      this.eventService.createEventPermission(
        session.data.type,
        session.data.name,
        session.data.location,
        session.data.date,
        session.data.attendance,
        resNum
      );

      return {
        response: getCompletionMessage(resNum, lang),
        suggestions: ['🚔 File a Complaint', '🏠 Tenant Verification', '🔍 Track Status'],
      };
    }

    return { response: 'Invalid step' };
  }

  // --- Tracking Workflow ---
  private async runTrackingWorkflow(session: ChatSessionState, msg: string): Promise<{ response: string; suggestions?: string[] }> {
    const step = session.step;
    const lang = session.language;

    const prompts = {
      en: "Please provide your Application Reference Number for tracking (e.g. UP-CMP-2026-123456):",
      hi: "कृपया ट्रैकिंग के लिए अपनी आवेदन संदर्भ संख्या प्रदान करें (उदा. UP-CMP-2026-123456):",
      hinglish: "Please track karne ke liye apna Application Reference Number batayein (jaise UP-CMP-2026-123456):",
    };

    if (step === 1) {
      session.step = 2;
      return { response: prompts[lang] };
    }

    if (step === 2) {
      session.workflow = null;
      session.step = 0;

      const trackInfo = await this.trackingService.track(msg);
      if (!trackInfo) {
        const errorResponses = {
          en: `❌ No application found matching reference number \`${msg}\`. Please check and try again.`,
          hi: `❌ संदर्भ संख्या \`${msg}\` से मेल खाता कोई आवेदन नहीं मिला। कृपया जांचें और पुनः प्रयास करें।`,
          hinglish: `❌ \`${msg}\` reference number ka koi application nahi mila. Please check karke fir se try karein.`,
        };
        return {
          response: errorResponses[lang],
          suggestions: ['🚔 File a Complaint', '🏠 Tenant Verification', '🔍 Track Status'],
        };
      }

      const statusDesc = {
        'Submitted': 'The application has been successfully filed and is in queue.',
        'Under Review': 'The local police desk is auditing the credentials.',
        'Pending Verification': 'A local beat officer is assigned for address physical check.',
        'Approved': 'Verification is cleared and the final certificate/status is ready.',
        'Rejected': 'Application rejected due to invalid details or failed inspection.',
      };

      const statusEmojis = {
        'Submitted': '📋',
        'Under Review': '🔍',
        'Pending Verification': '🏠',
        'Approved': '✅',
        'Rejected': '❌',
      };

      const responses = {
        en: `🔍 **Application Tracking Details:**\n\n- **Reference Number:** \`${trackInfo.referenceNumber}\`\n- **Service:** ${trackInfo.serviceType}\n- **Current Status:** ${statusEmojis[trackInfo.status] || ''} **${trackInfo.status}**\n- **Last Updated:** ${trackInfo.updatedAt.toLocaleString()}\n\n*Status Info:* ${statusDesc[trackInfo.status] || 'Processing.'}`,
        hi: `🔍 **आवेदन ट्रैकिंग विवरण:**\n\n- **संदर्भ संख्या:** \`${trackInfo.referenceNumber}\`\n- **सेवा:** ${trackInfo.serviceType}\n- **वर्तमान स्थिति:** ${statusEmojis[trackInfo.status] || ''} **${trackInfo.status}**\n- **अंतिम अपडेट:** ${trackInfo.updatedAt.toLocaleString()}`,
        hinglish: `🔍 **Application tracking status:**\n\n- **Reference Number:** \`${trackInfo.referenceNumber}\`\n- **Service:** ${trackInfo.serviceType}\n- **Current Status:** ${statusEmojis[trackInfo.status] || ''} **${trackInfo.status}**\n- **Last Updated:** ${trackInfo.updatedAt.toLocaleString()}`,
      };

      return {
        response: responses[lang],
        suggestions: ['🚔 File a Complaint', '🏠 Tenant Verification', '🔍 Track Status'],
      };
    }

    return { response: 'Invalid step' };
  }
}
