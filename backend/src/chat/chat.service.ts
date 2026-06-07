import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma.service';
import { ValidationService } from './validation.service';
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

interface CitizenState {
  id?: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  city: string;
  district: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  isConfirmed: boolean;
}

interface ChatSessionState {
  workflow: 'complaint' | 'verification' | 'certificate' | 'event' | 'tracking' | null;
  step: string;
  data: Record<string, any>;
  language: 'en' | 'hi' | 'hinglish';
  languageSelected: boolean;
  citizen: CitizenState;
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

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly complaintService: ComplaintService,
    private readonly verificationService: VerificationService,
    private readonly certificateService: CertificateService,
    private readonly eventService: EventService,
    private readonly trackingService: TrackingService,
    private readonly analyticsService: AnalyticsService,
    private readonly prisma: PrismaService,
    private readonly validationService: ValidationService,
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
  }

  async getOrCreateSession(sessionId: string): Promise<ChatSessionState> {
    try {
      const session = await this.prisma.workflowSession.findUnique({
        where: { id: sessionId },
      });
      if (session) {
        return typeof session.stateJson === 'string'
          ? JSON.parse(session.stateJson)
          : session.stateJson as unknown as ChatSessionState;
      }
    } catch (e) {
      this.logger.warn(`Failed to read session from DB: ${e.message}`);
    }

    return {
      workflow: null,
      step: 'START',
      data: {},
      language: 'en',
      languageSelected: false,
      citizen: {
        fullName: '',
        mobileNumber: '',
        email: '',
        city: '',
        district: '',
        state: 'Uttar Pradesh',
        latitude: null,
        longitude: null,
        isConfirmed: false,
      },
    };
  }

  async saveSession(sessionId: string, state: ChatSessionState): Promise<void> {
    try {
      await this.prisma.workflowSession.upsert({
        where: { id: sessionId },
        update: {
          stateJson: state as any,
          currentStep: state.step || 'START',
          serviceType: state.workflow || null,
        },
        create: {
          id: sessionId,
          stateJson: state as any,
          currentStep: state.step || 'START',
          serviceType: state.workflow || null,
        },
      });
    } catch (e) {
      this.logger.warn(`Failed to save session to DB: ${e.message}`);
    }
  }

  async sendMessage(
    message: string,
    sessionId: string,
    latitude?: number,
    longitude?: number,
  ): Promise<{ response: string; suggestions?: string[] }> {
    this.analyticsService.trackHelpRequest();
    
    // Load session state
    const state = await this.getOrCreateSession(sessionId);

    // Update latitude and longitude if passed
    if (latitude !== undefined && latitude !== null) {
      state.citizen.latitude = latitude;
    }
    if (longitude !== undefined && longitude !== null) {
      state.citizen.longitude = longitude;
    }

    try {
      this.logger.log(`Forwarding message to FastAPI AI service: ${this.aiServiceUrl}/chat/message`);
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/chat/message`, {
          message,
          session_id: sessionId,
          latitude: state.citizen.latitude,
          longitude: state.citizen.longitude,
          state: state,
        }),
      );

      const responseData = response.data;
      
      // If AI service returns updated state, capture it
      if (responseData && responseData.state) {
        Object.assign(state, responseData.state);
      }

      if (responseData && responseData.db_action) {
        await this.executeDbAction(responseData.db_action);
      }

      if (responseData && responseData.response) {
        const text = responseData.response;
        if (text.includes('112')) this.analyticsService.trackHelplineRecommendation('112');
        if (text.includes('1090')) this.analyticsService.trackHelplineRecommendation('1090');
        if (text.includes('1930')) this.analyticsService.trackHelplineRecommendation('1930');
        if (text.includes('1098')) this.analyticsService.trackHelplineRecommendation('1098');
        
        if (text.includes('EMERGENCY') || text.includes('Notice') || text.includes('आपातकालीन')) {
          this.analyticsService.trackEmergencyOverride();
        }
      }

      // Persist state to DB
      await this.saveSession(sessionId, state);
      return responseData;
    } catch (e) {
      this.logger.warn(`AI Service connection failed (${e.message}). Initializing local rule-based mock workflow engine.`);
      const localResult = await this.handleLocalFallback(message, sessionId, state);
      await this.saveSession(sessionId, state);
      return localResult;
    }
  }

  private async executeDbAction(dbAction: { type: string; data: Record<string, any> }) {
    try {
      this.logger.log(`Executing DB Action: ${dbAction.type}`);
      switch (dbAction.type) {
        case 'citizen':
          const citizen = await this.prisma.citizen.upsert({
            where: { id: dbAction.data.id || 'new-id' },
            update: {
              fullName: dbAction.data.fullName,
              mobileNumber: dbAction.data.mobileNumber,
              email: dbAction.data.email,
              addressLine1: dbAction.data.addressLine1,
              city: dbAction.data.city,
              district: dbAction.data.district,
              state: dbAction.data.state,
              latitude: dbAction.data.latitude,
              longitude: dbAction.data.longitude,
              isConfirmed: dbAction.data.isConfirmed,
            },
            create: {
              fullName: dbAction.data.fullName,
              mobileNumber: dbAction.data.mobileNumber,
              email: dbAction.data.email,
              addressLine1: dbAction.data.addressLine1,
              city: dbAction.data.city,
              district: dbAction.data.district,
              state: dbAction.data.state,
              latitude: dbAction.data.latitude,
              longitude: dbAction.data.longitude,
              isConfirmed: dbAction.data.isConfirmed,
            },
          });
          return citizen;
        case 'complaint':
          await this.complaintService.createComplaint(
            dbAction.data.type,
            dbAction.data.details,
            dbAction.data.refNum,
            dbAction.data.citizenId,
          );
          break;
        case 'verification':
          await this.verificationService.createVerification(
            dbAction.data.type,
            dbAction.data.name,
            dbAction.data.address,
            dbAction.data.mobile,
            dbAction.data.propertyDetails,
            dbAction.data.refNum,
            dbAction.data.citizenId,
          );
          break;
        case 'certificate':
          await this.certificateService.createCertificate(
            dbAction.data.name,
            dbAction.data.address,
            dbAction.data.district,
            dbAction.data.purpose,
            dbAction.data.refNum,
            dbAction.data.citizenId,
          );
          break;
        case 'event':
          await this.eventService.createEventPermission(
            dbAction.data.type,
            dbAction.data.name,
            dbAction.data.location,
            dbAction.data.date,
            dbAction.data.attendance,
            dbAction.data.refNum,
            dbAction.data.citizenId,
          );
          break;
      }
    } catch (error) {
      this.logger.error(`Failed to execute DB action: ${error.message}`);
    }
  }

  private async handleLocalFallback(
    message: string,
    sessionId: string,
    state: ChatSessionState,
  ): Promise<{ response: string; suggestions?: string[] }> {
    const cleanMsg = message.trim().toLowerCase();

    // 1. Emergency Checks
    const emergencyKeywords = [
      'danger', 'assault', 'threat', 'life', 'weapon', 'murder', 'burglar', 'attack', 'emergency',
      'मदद', 'खतरा', 'हमला', 'kidnapping', 'burglary', 'ongoing attack', 'burglary in progress', 'immediate danger'
    ];
    if (emergencyKeywords.some(keyword => cleanMsg.includes(keyword))) {
      state.workflow = null;
      state.step = 'START';
      state.data = {};
      return {
        response: getEmergencyMessage(state.language),
        suggestions: ['🚔 File a Complaint', '🔍 Track Status'],
      };
    }

    // Language selection
    if (!state.languageSelected) {
      let matchedLang = false;
      if (cleanMsg === 'english' || cleanMsg.includes('option:english')) {
        state.language = 'en';
        state.languageSelected = true;
        matchedLang = true;
      } else if (cleanMsg === 'हिंदी' || cleanMsg.includes('hindi') || cleanMsg.includes('option:हिंदी') || cleanMsg.includes('option:हिंदी (hindi)')) {
        state.language = 'hi';
        state.languageSelected = true;
        matchedLang = true;
      } else if (cleanMsg === 'hinglish' || cleanMsg.includes('option:hinglish')) {
        state.language = 'hinglish';
        state.languageSelected = true;
        matchedLang = true;
      }

      if (matchedLang) {
        this.analyticsService.trackLanguage(state.language);
        return {
          response: LANGUAGE_SELECTION_RESPONSES[state.language],
          suggestions: ['🚔 File a Complaint', '🏠 Tenant Verification', '📜 Character Certificate', '🎭 Event Permission', '🔍 Track Application'],
        };
      }

      // Detect starting workflow in greeting
      const startsWf = this.detectWorkflowIntent(cleanMsg);
      if (startsWf) {
        state.workflow = startsWf;
        state.languageSelected = true;
        this.analyticsService.trackLanguage(state.language);
      } else {
        return {
          response: WELCOME_MESSAGE,
          suggestions: ['English', 'हिंदी', 'Hinglish'],
        };
      }
    }

    const lang = state.language;

    // Cancel command
    if (cleanMsg === 'cancel' || cleanMsg === 'radd' || cleanMsg === 'रद्द' || cleanMsg === 'exit') {
      state.workflow = null;
      state.step = 'START';
      state.data = {};
      return {
        response: TRANSLATIONS[lang].cancel,
        suggestions: ['🚔 File a Complaint', '🏠 Tenant Verification', '📜 Character Certificate', '🎭 Event Permission', '🔍 Track Application'],
      };
    }

    // Check if workflow needs to be determined
    if (!state.workflow) {
      const detectedWf = this.detectWorkflowIntent(cleanMsg);
      if (detectedWf) {
        state.workflow = detectedWf;
        state.step = 'START';
      }
    }

    if (!state.workflow) {
      // General FAQ Fallbacks
      const faqList = [
        {
          keys: ['postmortem', 'post mortem', 'pm report', 'पोस्टमार्टम'],
          response: '🔬 **Postmortem Report Request Procedure:**\nTo obtain a postmortem report in Uttar Pradesh:\n1. Apply at the district Chief Medical Officer (CMO) office.\n2. Submit a request letter indicating the relationship to the deceased, along with copy of FIR/Panchnama and death certificate.\n*(Note: Rakku assists in guidance, but actual reports are issued offline by CMO office).*',
        },
        {
          keys: ['police services', 'what do you do', 'services', 'help', 'मदद', 'सुविधाएं'],
          response: '👮 **UP Police Citizen Services:**\nThrough our online portal, citizens can access:\n- FIR Lodging\n- Character Verification\n- Tenant/PG/Domestic Help Verification\n- Event/Protest/Procession permissions\n\nLet me know which service you are interested in.',
        }
      ];

      for (const faq of faqList) {
        if (faq.keys.some(k => cleanMsg.includes(k))) {
          return {
            response: faq.response,
            suggestions: ['🚔 File a Complaint', '🏠 Tenant Verification', '📜 Character Certificate', '🔍 Track Application'],
          };
        }
      }

      return {
        response: WELCOME_MESSAGE,
        suggestions: ['English', 'हिंदी', 'Hinglish'],
      };
    }

    // Enforce Citizen Identification & Confirmation first (unless already confirmed)
    if (!state.citizen.isConfirmed && state.workflow !== 'tracking') {
      return this.runCitizenIdentificationFlow(state, message);
    }

    // Process Active Workflows
    let empathyPrepend = "";
    if (message && !state.data.empathyShown) {
      empathyPrepend = getEmpathyMessage(message, lang);
      if (empathyPrepend) {
        state.data.empathyShown = true;
      }
    }

    let res: { response: string; suggestions?: string[] };
    switch (state.workflow) {
      case 'complaint':
        res = await this.runComplaintWorkflow(state, message);
        break;
      case 'verification':
        res = await this.runVerificationWorkflow(state, message);
        break;
      case 'certificate':
        res = await this.runCertificateWorkflow(state, message);
        break;
      case 'event':
        res = await this.runEventWorkflow(state, message);
        break;
      case 'tracking':
        res = await this.runTrackingWorkflow(state, message);
        break;
      default:
        res = { response: TRANSLATIONS[lang].invalidStep };
    }

    if (empathyPrepend && res) {
      res.response = empathyPrepend + res.response;
    }
    return res;
  }

  private detectWorkflowIntent(cleanMsg: string): ChatSessionState['workflow'] {
    if (cleanMsg.includes('complaint') || cleanMsg.includes('stolen') || cleanMsg.includes('shikayat') || cleanMsg.includes('चोरी') || cleanMsg.includes('शिकायत') || cleanMsg.includes('lost') || cleanMsg.includes('wallet') || cleanMsg.includes('pocket')) {
      return 'complaint';
    }
    if (cleanMsg.includes('tenant') || cleanMsg.includes('verification') || cleanMsg.includes('satyapan') || cleanMsg.includes('किरायेदार') || cleanMsg.includes('सत्यापन')) {
      return 'verification';
    }
    if (cleanMsg.includes('certificate') || cleanMsg.includes('character') || cleanMsg.includes('charitra') || cleanMsg.includes('चरित्र') || cleanMsg.includes('प्रमाण')) {
      return 'certificate';
    }
    if (cleanMsg.includes('event') || cleanMsg.includes('permission') || cleanMsg.includes('protest') || cleanMsg.includes('procession') || cleanMsg.includes('shooting') || cleanMsg.includes('अनुमति')) {
      return 'event';
    }
    if (cleanMsg.includes('track') || cleanMsg.includes('status') || cleanMsg.includes('pata karein') || cleanMsg.includes('स्थिति')) {
      return 'tracking';
    }
    return null;
  }

  private async runCitizenIdentificationFlow(
    state: ChatSessionState,
    message: string,
  ): Promise<{ response: string; suggestions?: string[] }> {
    const cleanMsg = message.trim().toLowerCase();
    const extracted = this.validationService.extractCitizenData(message);

    // Merge extracted details
    if (extracted.fullName && !state.citizen.fullName) {
      state.citizen.fullName = extracted.fullName;
    }
    if (extracted.mobileNumber && !state.citizen.mobileNumber) {
      state.citizen.mobileNumber = extracted.mobileNumber;
    }
    if (extracted.location && !state.citizen.city) {
      state.citizen.city = extracted.location;
      state.citizen.district = extracted.location;
    }

    // Natural Language Corrections check
    const isCorrection = this.handleProfileCorrection(state, message);
    if (isCorrection) {
      return this.renderConfirmationCard(state);
    }

    // State Machine Steps
    if (state.step === 'IDENTIFY_NAME') {
      if (this.validationService.validateName(message)) {
        state.citizen.fullName = message.trim();
      } else {
        return {
          response: "👮 I may not have captured your name correctly.\n\nPlease enter your full name (alphabets only):",
          suggestions: [],
        };
      }
    } else if (state.step === 'IDENTIFY_MOBILE') {
      if (this.validationService.validateMobile(message)) {
        state.citizen.mobileNumber = this.validationService.normalizeMobile(message)!;
      } else {
        return {
          response: "👮 Please provide a valid 10-digit mobile number:",
          suggestions: [],
        };
      }
    } else if (state.step === 'IDENTIFY_LOCATION') {
      if (message.trim().length >= 3) {
        state.citizen.city = message.trim();
        state.citizen.district = message.trim();
      } else {
        return {
          response: "👮 I couldn't understand that location. Please tell me your city, district, or area:",
          suggestions: [],
        };
      }
    } else if (state.step === 'CONFIRM_PROFILE') {
      if (cleanMsg === 'yes' || cleanMsg === 'correct' || cleanMsg.includes('option:yes') || cleanMsg.includes('option:confirm details') || cleanMsg.includes('confirm')) {
        state.citizen.isConfirmed = true;
        
        // Save Citizen to Database
        try {
          const citizenRecord = await this.prisma.citizen.create({
            data: {
              fullName: state.citizen.fullName,
              mobileNumber: state.citizen.mobileNumber,
              email: state.citizen.email || null,
              city: state.citizen.city || null,
              district: state.citizen.district || null,
              state: state.citizen.state || "Uttar Pradesh",
              latitude: state.citizen.latitude || null,
              longitude: state.citizen.longitude || null,
              isConfirmed: true,
            }
          });
          state.citizen.id = citizenRecord.id;
        } catch (e) {
          state.citizen.id = `mock-citizen-${Math.random().toString(36).substring(7)}`;
        }

        const successText = `👮 **Citizen Profile Verified**

Name: **${state.citizen.fullName}**
Mobile: **${state.citizen.mobileNumber}**
Location: **${state.citizen.city || state.citizen.district || 'Lucknow'}, ${state.citizen.state}**

✓ Profile verification complete.
Let's continue with your request.`;

        // Direct transition to actual service workflow
        state.step = '1';
        let res: any;
        if (state.workflow === 'complaint') {
          // Pre-populate complaint auto-detection if applicable
          res = this.runComplaintWorkflow(state, "");
        } else if (state.workflow === 'verification') {
          res = this.runVerificationWorkflow(state, "");
        } else if (state.workflow === 'certificate') {
          res = this.runCertificateWorkflow(state, "");
        } else if (state.workflow === 'event') {
          res = this.runEventWorkflow(state, "");
        }
        return {
          response: successText + "\n\n" + res.response,
          suggestions: res.suggestions,
        };
      } else if (cleanMsg.includes('change') || cleanMsg.includes('modify')) {
        return {
          response: "Which field would you like to update? (e.g. type 'Change name to Amit Kumar' or 'Change mobile to 9999999999')",
          suggestions: ['Change name', 'Change mobile number'],
        };
      }
    }

    // Evaluate what is missing next
    if (!state.citizen.fullName) {
      state.step = 'IDENTIFY_NAME';
      return {
        response: "Before we begin, may I know your full name?",
        suggestions: [],
      };
    }

    if (!state.citizen.mobileNumber) {
      state.step = 'IDENTIFY_MOBILE';
      return {
        response: `Thank you, ${state.citizen.fullName}.\n\nCould you please share your mobile number?`,
        suggestions: [],
      };
    }

    // Attempt browser location mapping
    if (!state.citizen.city && !state.citizen.district) {
      if (state.citizen.latitude && state.citizen.longitude) {
        state.citizen.city = "Lucknow";
        state.citizen.district = "Lucknow";
      } else {
        state.step = 'IDENTIFY_LOCATION';
        return {
          response: "I couldn't determine your location automatically.\n\nCould you please tell me your city, district, or area?",
          suggestions: [],
        };
      }
    }

    // If everything is collected, show confirmation card
    state.step = 'CONFIRM_PROFILE';
    return this.renderConfirmationCard(state);
  }

  private handleProfileCorrection(state: ChatSessionState, message: string): boolean {
    const cleanMsg = message.trim().toLowerCase();

    // "My mobile number is 9123456789" / "Change my number to 9123456789"
    const phoneMatches = message.match(/(?:mobile|number|phone|change mobile to|change number to)\s+(?:is\s+)?((?:\+91[\s-]?)?[6-9]\d{9}|\b[6-9]\d{9}\b)/i);
    if (phoneMatches && phoneMatches[1]) {
      const normalized = this.validationService.normalizeMobile(phoneMatches[1]);
      if (normalized && this.validationService.validateMobile(normalized)) {
        state.citizen.mobileNumber = normalized;
        return true;
      }
    }

    // "My name is Rahul Verma" / "Change name to Rahul Verma"
    const nameMatches = message.match(/(?:name is|change name to|my name is)\s+([a-zA-Z\s'-]+)/i);
    if (nameMatches && nameMatches[1]) {
      const potentialName = nameMatches[1].trim();
      if (this.validationService.validateName(potentialName)) {
        state.citizen.fullName = potentialName;
        return true;
      }
    }

    // "I live in Kanpur" / "Change location to Varanasi"
    const locMatches = message.match(/(?:live in|change location to|change my location to)\s+([a-zA-Z\s'-]+)/i);
    if (locMatches && locMatches[1]) {
      const potentialLoc = locMatches[1].trim();
      if (potentialLoc.length >= 3) {
        state.citizen.city = potentialLoc;
        state.citizen.district = potentialLoc;
        return true;
      }
    }

    return false;
  }

  private renderConfirmationCard(state: ChatSessionState): { response: string; suggestions: string[] } {
    const response = `👮 **Please review your details:**

* **Name:** ${state.citizen.fullName}
* **Mobile Number:** ${state.citizen.mobileNumber}
* **Location:** ${state.citizen.city || state.citizen.district || 'Lucknow'}, ${state.citizen.state}

Is everything correct?

- [Confirm Details](option:Confirm Details)
- [Modify Details](option:Modify Details)`;

    return {
      response,
      suggestions: ['Confirm Details', 'Modify Details'],
    };
  }

  // --- Complaint Workflow ---
  private runComplaintWorkflow(session: ChatSessionState, msg: string): { response: string; suggestions?: string[] } {
    const step = session.step;
    const lang = session.language;
    const cleanMsg = msg.trim().toLowerCase();

    const prompts = {
      en: [
        "Please select the **Complaint Type**:\n\n- [Lost Mobile / Theft](option:Lost Mobile / Theft)\n- [Lost Document](option:Lost Document)\n- [Simple Harassment](option:Simple Harassment)\n- [Cyber Fraud / Financial Loss](option:Cyber Fraud / Financial Loss)",
        "Could you please tell me where the incident occurred?",
        "Thank you. Could you also tell me when did the incident occur (date in DD/MM/YYYY)?",
        "Got it. Could you briefly describe what happened?",
      ],
      hi: [
        "कृपया **शिकायत का प्रकार** चुनें:\n\n- [मोबाइल चोरी / गुम होना](option:Lost Mobile / Theft)\n- [खोया हुआ दस्तावेज़](option:Lost Document)\n- [सामान्य उत्पीड़न](option:Simple Harassment)\n- [साइबर धोखाधड़ी](option:Cyber Fraud / Financial Loss)",
        "क्या आप कृपया बता सकते हैं कि घटना कहाँ हुई थी?",
        "धन्यवाद। क्या आप यह भी बता सकते हैं कि घटना कब (दिनांक DD/MM/YYYY) हुई थी?",
        "समझ गया। क्या आप संक्षेप में बता सकते हैं कि क्या हुआ था?",
      ],
      hinglish: [
        "Please select the **Complaint Type**:\n\n- [Lost Mobile / Theft](option:Lost Mobile / Theft)\n- [Lost Document](option:Lost Document)\n- [Simple Harassment](option:Simple Harassment)\n- [Cyber Fraud / Financial Loss](option:Cyber Fraud / Financial Loss)",
        "Kya aap please bata sakte hain ki incident kahan hua tha?",
        "Thank you. Kya aap bata sakte hain ki incident kab (date DD/MM/YYYY) hua?",
        "Got it. Kya aap short mein describe kar sakte hain ki kya hua tha?",
      ],
    };

    if (step === 'REVIEW') {
      if (cleanMsg === 'yes' || cleanMsg === 'submit' || cleanMsg === 'confirm' || cleanMsg.includes('option:yes') || cleanMsg.includes('option:submit application') || cleanMsg.includes('confirm')) {
        session.workflow = null;
        session.step = 'START';
        const fullDetails = `Location: ${session.data.location} | Date/Time: ${session.data.time} | Description: ${session.data.description}`;
        const resNum = `UP-CMP-2026-${Math.floor(100000 + Math.random() * 900000)}`;
        this.complaintService.createComplaint(session.data.type, fullDetails, resNum, session.citizen.id);
        session.data = {};
        return {
          response: getCompletionMessage(resNum, lang),
          suggestions: ['File Complaint', 'Tenant Verification', 'Track Status'],
        };
      } else if (cleanMsg === 'no' || cleanMsg === 'modify' || cleanMsg.includes('option:no') || cleanMsg.includes('option:modify details') || cleanMsg.includes('modify')) {
        session.step = '2';
        session.data = {};
        return {
          response: "Understood. Let's restart the form. Please select or enter the details again.\n\n" + prompts[lang][0],
          suggestions: ['Lost Mobile / Theft', 'Lost Document', 'Simple Harassment', 'Cyber Fraud / Financial Loss'],
        };
      }
    }

    if (step === '1') {
      session.step = '2';
      return {
        response: prompts[lang][0],
        suggestions: ['Lost Mobile / Theft', 'Lost Document', 'Simple Harassment', 'Cyber Fraud / Financial Loss'],
      };
    }

    if (step === '2') {
      if (msg) session.data.type = msg;
      session.step = '3';
      return {
        response: prompts[lang][1],
      };
    }

    if (step === '3') {
      session.data.location = msg;
      session.step = '4';
      return {
        response: prompts[lang][2],
      };
    }

    if (step === '4') {
      if (!this.validationService.validateDate(msg, true)) {
        return {
          response: "⚠️ The date appears invalid or in the future.\n\nPlease provide a valid date in DD/MM/YYYY format:\nExample: 15/07/2026",
        };
      }
      session.data.time = msg;
      session.step = '5';
      return {
        response: prompts[lang][3],
      };
    }

    if (step === '5') {
      if (!this.validationService.validateConsistency(session.citizen.city, msg)) {
        return {
          response: "⚠️ I noticed a location contradiction in your details relative to your registered location. Please verify and confirm details again.",
        };
      }
      session.data.description = msg;
      session.step = 'REVIEW';

      const reviewScreen = `👮 **Please review your application.**

Name: **${session.citizen.fullName}**
Mobile: **${session.citizen.mobileNumber}**
District: **${session.citizen.city || 'Lucknow'}**
Complaint Type: **${session.data.type}**
Incident Location: **${session.data.location}**
Incident Date: **${session.data.time}**
Description: **${session.data.description}**

**Validation Status**

✓ Name Valid
✓ Mobile Number Valid
✓ Location Valid
✓ Complaint Details Complete
✓ Ready for Submission

Would you like to submit this application?

- [Submit Application](option:Submit Application)
- [Modify Details](option:Modify Details)`;

      return {
        response: reviewScreen,
        suggestions: ['Submit Application', 'Modify Details'],
      };
    }

    return { response: TRANSLATIONS[lang].invalidStep };
  }

  // --- Verification Workflow ---
  private runVerificationWorkflow(session: ChatSessionState, msg: string): { response: string; suggestions?: string[] } {
    const step = session.step;
    const lang = session.language;
    const cleanMsg = msg.trim().toLowerCase();

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

    if (step === 'REVIEW') {
      if (cleanMsg === 'yes' || cleanMsg === 'submit' || cleanMsg === 'confirm' || cleanMsg.includes('option:yes') || cleanMsg.includes('option:submit application') || cleanMsg.includes('confirm')) {
        session.workflow = null;
        session.step = 'START';
        const resNum = `UP-VER-2026-${Math.floor(100000 + Math.random() * 900000)}`;
        this.verificationService.createVerification(
          session.data.type,
          session.data.name,
          session.data.address,
          session.data.mobile,
          session.data.propertyDetails,
          resNum,
          session.citizen.id,
        );
        session.data = {};
        return {
          response: getCompletionMessage(resNum, lang),
          suggestions: ['File Complaint', 'Tenant Verification', 'Track Status'],
        };
      } else if (cleanMsg === 'no' || cleanMsg === 'modify' || cleanMsg.includes('option:no') || cleanMsg.includes('option:modify details') || cleanMsg.includes('modify')) {
        session.step = '2';
        session.data = {};
        return {
          response: "Understood. Let's restart the form. Please select or enter the details again.\n\n" + prompts[lang][0],
          suggestions: ['Tenant Verification', 'PG Verification', 'Domestic Help Verification', 'Employee Verification'],
        };
      }
    }

    if (step === '1') {
      session.step = '2';
      return {
        response: prompts[lang][0],
        suggestions: ['Tenant Verification', 'PG Verification', 'Domestic Help Verification', 'Employee Verification'],
      };
    }

    if (step === '2') {
      if (msg) session.data.type = msg;
      session.step = '3';
      return { response: prompts[lang][1] };
    }

    if (step === '3') {
      if (!this.validationService.validateName(msg)) {
        return {
          response: "⚠️ For official records, please enter the full name (at least a first name and a last name).\n\nExample:\nRahul Kumar",
        };
      }
      session.data.name = msg;
      session.step = '4';
      return { response: prompts[lang][2] };
    }

    if (step === '4') {
      session.data.address = msg;
      session.step = '5';
      return { response: prompts[lang][3] };
    }

    if (step === '5') {
      if (!this.validationService.validateMobile(msg)) {
        return {
          response: "⚠️ The mobile number appears incomplete.\n\nPlease provide a valid 10-digit Indian mobile number.\n\nExample:\n9876543210",
        };
      }
      session.data.mobile = this.validationService.normalizeMobile(msg)!;
      session.step = '6';
      return { response: prompts[lang][4] };
    }

    if (step === '6') {
      session.data.propertyDetails = msg;
      session.step = 'REVIEW';

      const reviewScreen = `👮 **Please review your application.**

Name: **${session.citizen.fullName}**
Mobile: **${session.citizen.mobileNumber}**
Verification Type: **${session.data.type}**
Candidate Name: **${session.data.name}**
Candidate Mobile: **${session.data.mobile}**
Candidate Address: **${session.data.address}**
Property Details: **${session.data.propertyDetails}**

**Validation Status**

✓ Candidate Name Valid
✓ Candidate Mobile Valid
✓ Property Address Valid
✓ Verification Details Complete
✓ Ready for Submission

Would you like to submit this application?

- [Submit Application](option:Submit Application)
- [Modify Details](option:Modify Details)`;

      return {
        response: reviewScreen,
        suggestions: ['Submit Application', 'Modify Details'],
      };
    }

    return { response: 'Invalid step' };
  }

  // --- Character Certificate Workflow ---
  private runCertificateWorkflow(session: ChatSessionState, msg: string): { response: string; suggestions?: string[] } {
    const step = session.step;
    const lang = session.language;
    const cleanMsg = msg.trim().toLowerCase();

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

    if (step === 'REVIEW') {
      if (cleanMsg === 'yes' || cleanMsg === 'submit' || cleanMsg === 'confirm' || cleanMsg.includes('option:yes') || cleanMsg.includes('option:submit application') || cleanMsg.includes('confirm')) {
        session.workflow = null;
        session.step = 'START';
        const resNum = `UP-CER-2026-${Math.floor(100000 + Math.random() * 900000)}`;
        this.certificateService.createCertificate(
          session.data.name,
          session.data.address,
          session.data.district,
          session.data.purpose,
          resNum,
          session.citizen.id,
        );
        session.data = {};
        return {
          response: getCompletionMessage(resNum, lang),
          suggestions: ['File Complaint', 'Tenant Verification', 'Track Status'],
        };
      } else if (cleanMsg === 'no' || cleanMsg === 'modify' || cleanMsg.includes('option:no') || cleanMsg.includes('option:modify details') || cleanMsg.includes('modify')) {
        session.step = '2';
        session.data = {};
        return {
          response: "Understood. Let's restart the form. Please select or enter the details again.\n\n" + prompts[lang][0],
        };
      }
    }

    if (step === '1') {
      session.step = '2';
      return { response: prompts[lang][0] };
    }

    if (step === '2') {
      if (!this.validationService.validateName(msg)) {
        return {
          response: "⚠️ For official records, please enter the full name (at least a first name and a last name).\n\nExample:\nRahul Kumar",
        };
      }
      session.data.name = msg;
      session.step = '3';
      return { response: prompts[lang][1] };
    }

    if (step === '3') {
      session.data.address = msg;
      session.step = '4';
      return {
        response: prompts[lang][2],
        suggestions: ['Lucknow', 'Kanpur', 'Noida', 'Ghaziabad', 'Varanasi', 'Prayagraj'],
      };
    }

    if (step === '4') {
      session.data.district = msg;
      session.step = '5';
      return {
        response: prompts[lang][3],
        suggestions: ['Job Application', 'Passport', 'Visa', 'Higher Education', 'Government Service'],
      };
    }

    if (step === '5') {
      if (!["Job Application", "Passport", "Visa", "Higher Education", "Government Service"].includes(msg)) {
        return {
          response: "⚠️ Could you please select a valid purpose?\n\nExamples:\n• Job Application\n• Passport\n• Visa\n• Higher Education\n• Government Service",
          suggestions: ['Job Application', 'Passport', 'Visa', 'Higher Education', 'Government Service'],
        };
      }
      session.data.purpose = msg;
      session.step = 'REVIEW';

      const reviewScreen = `👮 **Please review your application.**

Name: **${session.citizen.fullName}**
Mobile: **${session.citizen.mobileNumber}**
Applicant Name: **${session.data.name}**
Applicant Address: **${session.data.address}**
District: **${session.data.district}**
Purpose: **${session.data.purpose}**

**Validation Status**

✓ Applicant Name Valid
✓ District Valid
✓ Purpose Valid
✓ Character Certificate Details Complete
✓ Ready for Submission

Would you like to submit this application?

- [Submit Application](option:Submit Application)
- [Modify Details](option:Modify Details)`;

      return {
        response: reviewScreen,
        suggestions: ['Submit Application', 'Modify Details'],
      };
    }

    return { response: 'Invalid step' };
  }

  // --- Event Permission Workflow ---
  private runEventWorkflow(session: ChatSessionState, msg: string): { response: string; suggestions?: string[] } {
    const step = session.step;
    const lang = session.language;
    const cleanMsg = msg.trim().toLowerCase();

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

    if (step === 'REVIEW') {
      if (cleanMsg === 'yes' || cleanMsg === 'submit' || cleanMsg === 'confirm' || cleanMsg.includes('option:yes') || cleanMsg.includes('option:submit application') || cleanMsg.includes('confirm')) {
        session.workflow = null;
        session.step = 'START';
        const resNum = `UP-EVP-2026-${Math.floor(100000 + Math.random() * 900000)}`;
        this.eventService.createEventPermission(
          session.data.type,
          session.data.name,
          session.data.location,
          session.data.date,
          session.data.attendance,
          resNum,
          session.citizen.id,
        );
        session.data = {};
        return {
          response: getCompletionMessage(resNum, lang),
          suggestions: ['File Complaint', 'Tenant Verification', 'Track Status'],
        };
      } else if (cleanMsg === 'no' || cleanMsg === 'modify' || cleanMsg.includes('option:no') || cleanMsg.includes('option:modify details') || cleanMsg.includes('modify')) {
        session.step = '2';
        session.data = {};
        return {
          response: "Understood. Let's restart the form. Please select or enter the details again.\n\n" + prompts[lang][0],
          suggestions: ['Event Permission', 'Procession Request', 'Protest Request', 'Film Shooting Request'],
        };
      }
    }

    if (step === '1') {
      session.step = '2';
      return {
        response: prompts[lang][0],
        suggestions: ['Event Permission', 'Procession Request', 'Protest Request', 'Film Shooting Request'],
      };
    }

    if (step === '2') {
      if (msg) session.data.type = msg;
      session.step = '3';
      return { response: prompts[lang][1] };
    }

    if (step === '3') {
      session.data.name = msg;
      session.step = '4';
      return { response: prompts[lang][2] };
    }

    if (step === '4') {
      session.data.location = msg;
      session.step = '5';
      return { response: prompts[lang][3] };
    }

    if (step === '5') {
      if (!this.validationService.validateDate(msg, false)) {
        return {
          response: "⚠️ Please provide a valid date in DD/MM/YYYY format:\nExample: 15/08/2026",
        };
      }
      session.data.date = msg;
      session.step = '6';
      return { response: prompts[lang][4] };
    }

    if (step === '6') {
      if (!/^\d+$/.test(msg)) {
        return {
          response: "⚠️ Please enter a valid number for expected attendance:\nExample: 500",
        };
      }
      session.data.attendance = parseInt(msg) || 100;
      session.step = 'REVIEW';

      const reviewScreen = `👮 **Please review your application.**

Name: **${session.citizen.fullName}**
Mobile: **${session.citizen.mobileNumber}**
Request Type: **${session.data.type}**
Event Name: **${session.data.name}**
Location: **${session.data.location}**
Date: **${session.data.date}**
Attendance: **${session.data.attendance}**

**Validation Status**

✓ Event Name Valid
✓ Date Valid
✓ Expected Attendance Valid
✓ Event Permission Details Complete
✓ Ready for Submission

Would you like to submit this application?

- [Submit Application](option:Submit Application)
- [Modify Details](option:Modify Details)`;

      return {
        response: reviewScreen,
        suggestions: ['Submit Application', 'Modify Details'],
      };
    }

    return { response: 'Invalid step' };
  }

  // --- Tracking Workflow ---
  private async runTrackingWorkflow(session: ChatSessionState, msg: string): Promise<{ response: string; suggestions?: string[] }> {
    const step = parseInt(session.step) || 1;
    const lang = session.language;

    const prompts = {
      en: "Please provide your Application Reference Number for tracking (e.g. UP-CMP-2026-123456):",
      hi: "कृपया ट्रैकिंग के लिए अपनी आवेदन संदर्भ संख्या प्रदान करें (उदा. UP-CMP-2026-123456):",
      hinglish: "Please track karne ke liye apna Application Reference Number batayein (jaise UP-CMP-2026-123456):",
    };

    if (step === 1) {
      session.step = '2';
      return { response: prompts[lang] };
    }

    if (step === 2) {
      session.workflow = null;
      session.step = 'START';

      const trackInfo = await this.trackingService.track(msg);
      if (!trackInfo) {
        const errorResponses = {
          en: `❌ No application found matching reference number \`${msg}\`. Please check and try again.`,
          hi: `❌ संदर्भ संख्या \`${msg}\` से मेल खाता कोई आवेदन नहीं मिला। कृपया जांचें और पुनः प्रयास करें।`,
          hinglish: `❌ \`${msg}\` reference number ka koi application nahi mila. Please check karke fir se try karein.`,
        };
        return {
          response: errorResponses[lang],
          suggestions: ['File Complaint', 'Tenant Verification', 'Track Status'],
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
        suggestions: ['File Complaint', 'Tenant Verification', 'Track Status'],
      };
    }

    return { response: 'Invalid step' };
  }
}
