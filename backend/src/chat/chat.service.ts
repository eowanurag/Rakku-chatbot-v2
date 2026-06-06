import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ComplaintService } from '../complaint/complaint.service';
import { VerificationService } from '../verification/verification.service';
import { CertificateService } from '../certificate/certificate.service';
import { EventService } from '../event/event.service';
import { TrackingService } from '../tracking/tracking.service';

interface ChatSessionState {
  workflow: 'complaint' | 'verification' | 'certificate' | 'event' | 'tracking' | null;
  step: number;
  data: Record<string, any>;
  language: 'en' | 'hi' | 'hinglish';
}

const TRANSLATIONS = {
  en: {
    welcome: "👮 **Welcome! I am Rakku, your Digital Police Assistant.**\nHow can I help you today? I can guide you through the following digital services:",
    cancel: "Current request has been cancelled. How else can I assist you?",
    invalidStep: "I couldn't understand that. Let's restart the workflow.",
    upcopApp: "\n\n📱 *Need more official services? Download the official **UPCOP Mobile App** from the [Google Play Store](https://play.google.com/store/apps/details?id=com.up.uppolice) to access 27+ citizen services directly.*",
  },
  hi: {
    welcome: "👮 **नमस्कार! मैं रक्कु हूँ, आपका डिजिटल पुलिस सहायक।**\nआज मैं आपकी क्या सहायता कर सकता हूँ? मैं आपको निम्नलिखित डिजिटल सेवाओं में मदद कर सकता हूँ:",
    cancel: "वर्तमान अनुरोध रद्द कर दिया गया है। मैं आपकी और क्या सहायता कर सकता हूँ?",
    invalidStep: "मुझे समझ नहीं आया। चलिए फिर से शुरू करते हैं।",
    upcopApp: "\n\n📱 *अधिक आधिकारिक नागरिक सेवाओं के लिए, गूगल प्ले स्टोर से आधिकारिक **UPCOP मोबाइल ऐप** डाउनलोड करें: [गूगल प्ले स्टोर](https://play.google.com/store/apps/details?id=com.up.uppolice)।*",
  },
  hinglish: {
    welcome: "👮 **Hello! Main Rakku hoon, aapka Digital Police Assistant.**\nMain aapki kya help kar sakta hoon? Main niche diye gaye tasks me help kar sakta hoon:",
    cancel: "Request cancel kar di gayi hai. Aapko aur kis cheez me help chahiye?",
    invalidStep: "Mujhe samajh nahi aaya. Fir se try karte hain.",
    upcopApp: "\n\n📱 *Baaki official services ke liye, official **UPCOP App** download karein: [Google Play Store](https://play.google.com/store/apps/details?id=com.up.uppolice).* ",
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
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
  }

  async sendMessage(message: string, sessionId: string): Promise<{ response: string; suggestions?: string[] }> {
    try {
      this.logger.log(`Forwarding message to FastAPI AI service: ${this.aiServiceUrl}/chat/message`);
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/chat/message`, {
          message,
          session_id: sessionId,
        }),
      );
      return response.data;
    } catch (e) {
      this.logger.warn(`AI Service connection failed (${e.message}). Initializing local rule-based mock workflow engine.`);
      return this.handleLocalFallback(message, sessionId);
    }
  }

  private async handleLocalFallback(message: string, sessionId: string): Promise<{ response: string; suggestions?: string[] }> {
    const cleanMsg = message.trim().toLowerCase();

    // 1. Emergency Checks
    const emergencyKeywords = ['danger', 'assault', 'threat', 'life', 'weapon', 'murder', 'burglar', 'attack', 'emergency', 'मदद', 'खतरा', 'हमला'];
    if (emergencyKeywords.some(keyword => cleanMsg.includes(keyword))) {
      return {
        response: '⚠️ **EMERGENCY NOTICE / आपातकालीन सूचना:**\nThis appears to be an emergency requiring immediate action. Please contact UP Police emergency services immediately by dialing **112** or go to your nearest police station. We cannot dispatch officers or log active emergency reports through this assistant.\n\nयह एक आपातकालीन स्थिति लगती है। कृपया तुरंत **112** डायल करके उत्तर प्रदेश पुलिस आपातकालीन सेवाओं से संपर्क करें।',
        suggestions: ['Main Dashboard', 'File Complaint', 'Track Status'],
      };
    }

    // Initialize session if not exists
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        workflow: null,
        step: 0,
        data: {},
        language: 'en',
      });
    }

    const session = this.sessions.get(sessionId)!;

    // Detect language preference
    if (cleanMsg.includes('हिन्दी') || cleanMsg.includes('hindi') || cleanMsg.includes('हिंदी')) {
      session.language = 'hi';
    } else if (cleanMsg.includes('hinglish') || cleanMsg.includes('karna hai')) {
      session.language = 'hinglish';
    }

    const lang = session.language;

    // Cancel command
    if (cleanMsg === 'cancel' || cleanMsg === 'radd' || cleanMsg === 'रद्द' || cleanMsg === 'exit') {
      session.workflow = null;
      session.step = 0;
      session.data = {};
      return {
        response: TRANSLATIONS[lang].cancel,
        suggestions: ['File Complaint', 'Tenant Verification', 'Character Certificate', 'Event Permission', 'Track Application'],
      };
    }

    // 2. Manage Active Workflows
    if (session.workflow) {
      switch (session.workflow) {
        case 'complaint':
          return this.runComplaintWorkflow(session, message);
        case 'verification':
          return this.runVerificationWorkflow(session, message);
        case 'certificate':
          return this.runCertificateWorkflow(session, message);
        case 'event':
          return this.runEventWorkflow(session, message);
        case 'tracking':
          return this.runTrackingWorkflow(session, message);
      }
    }

    // 3. Detect Intent & Start Workflows
    if (cleanMsg.includes('complaint') || cleanMsg.includes('stolen') || cleanMsg.includes('shikayat') || cleanMsg.includes('चोरी') || cleanMsg.includes('शिकायत')) {
      session.workflow = 'complaint';
      session.step = 1;
      session.data = {};
      return this.runComplaintWorkflow(session, message);
    }

    if (cleanMsg.includes('tenant') || cleanMsg.includes('verification') || cleanMsg.includes('satyapan') || cleanMsg.includes('किरायेदार') || cleanMsg.includes('सत्यापन')) {
      session.workflow = 'verification';
      session.step = 1;
      session.data = {};
      return this.runVerificationWorkflow(session, message);
    }

    if (cleanMsg.includes('certificate') || cleanMsg.includes('character') || cleanMsg.includes('charitra') || cleanMsg.includes('चरित्र') || cleanMsg.includes('प्रमाण')) {
      session.workflow = 'certificate';
      session.step = 1;
      session.data = {};
      return this.runCertificateWorkflow(session, message);
    }

    if (cleanMsg.includes('event') || cleanMsg.includes('permission') || cleanMsg.includes('protest') || cleanMsg.includes('shooting') || cleanMsg.includes('अनुमति')) {
      session.workflow = 'event';
      session.step = 1;
      session.data = {};
      return this.runEventWorkflow(session, message);
    }

    if (cleanMsg.includes('track') || cleanMsg.includes('status') || cleanMsg.includes('pata karein') || cleanMsg.includes('स्थिति')) {
      session.workflow = 'tracking';
      session.step = 1;
      session.data = {};
      return this.runTrackingWorkflow(session, message);
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
          suggestions: ['File Complaint', 'Tenant Verification', 'Character Certificate', 'Ask about Postmortem'],
        };
      }
    }

    // Default Greeting
    return {
      response: `${TRANSLATIONS[lang].welcome}\n\n1. 📋 **File Complaint** (e.g. phone theft, lost items)\n2. 🏠 **Tenant Verification** (PG, Domestic help, Tenant details)\n3. 🎖️ **Character Certificate** (for employment/visas)\n4. 📅 **Event Permission** (Processions, protests, film shooting)\n5. 🔍 **Track Application** (check mock application status)\n\nPlease choose one of the actions below or type your query in English or Hindi.${TRANSLATIONS[lang].upcopApp}`,
      suggestions: ['File Complaint', 'Tenant Verification', 'Character Certificate', 'Event Permission', 'Track Application'],
    };
  }

  // --- Complaint Workflow ---
  private runComplaintWorkflow(session: ChatSessionState, msg: string): { response: string; suggestions?: string[] } {
    const step = session.step;
    const lang = session.language;

    const prompts = {
      en: [
        "Please select the **Complaint Type**:\n- Lost Document (e.g. Aadhaar, Passport)\n- Lost Mobile / Theft\n- Simple Harassment\n- Cyber Fraud / Financial Loss",
        "Please provide the **Incident Details** (date, time, location, description):",
        "Processing your complaint...",
      ],
      hi: [
        "कृपया **शिकायत का प्रकार** चुनें:\n- खोया हुआ दस्तावेज़ (आधार, पासपोर्ट)\n- मोबाइल चोरी / गुम होना\n- सामान्य उत्पीड़न\n- साइबर धोखाधड़ी",
        "कृपया **घटना का विवरण** दें (दिनांक, समय, स्थान, विवरण):",
        "आपकी शिकायत दर्ज की जा रही है...",
      ],
      hinglish: [
        "Please select the **Complaint Type**:\n- Lost Document (Aadhaar, Passport)\n- Lost Mobile / Theft\n- Simple Harassment\n- Cyber Fraud",
        "Apna **Incident Details** batayein (date, time, location, description):",
        "Complaint register ho rahi hai...",
      ],
    };

    if (step === 1) {
      session.step = 2;
      return {
        response: prompts[lang][0],
        suggestions: ['Lost Mobile / Theft', 'Lost Document', 'Cyber Fraud'],
      };
    }

    if (step === 2) {
      session.data.type = msg;
      session.step = 3;
      return {
        response: prompts[lang][1],
      };
    }

    if (step === 3) {
      session.data.details = msg;
      session.workflow = null;
      session.step = 0;

      // Call service
      const mockResult = this.complaintService.createComplaint(session.data.type, session.data.details);
      const resNum = `UP-CMP-2026-${Math.floor(100000 + Math.random() * 900000)}`;

      const responses = {
        en: `✅ **Complaint Drafted Successfully!**\nYour mock complaint reference number is: \`${resNum}\`.\n\n*Summary:*\n- **Type:** ${session.data.type}\n- **Details:** ${session.data.details}\n\nYou can track its progress using the tracking module.`,
        hi: `✅ **शिकायत सफलतापूर्वक दर्ज हुई!**\nआपका संदर्भ संख्या (Reference Number): \`${resNum}\`.\n\n*विवरण:*\n- **प्रकार:** ${session.data.type}\n- **विवरण:** ${session.data.details}\n\nआप इस संदर्भ संख्या से अपनी स्थिति ट्रैक कर सकते हैं।`,
        hinglish: `✅ **Complaint successfully register ho gayi hai!**\nAapka reference number hai: \`${resNum}\`.\n\n*Summary:*\n- **Type:** ${session.data.type}\n- **Details:** ${session.data.details}\n\nAap tracking section me jaakar ise track kar sakte hain.`,
      };

      return {
        response: responses[lang],
        suggestions: ['Track Status', 'New Chat'],
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
        "Please select the **Verification Type**:\n- Tenant Verification\n- PG Verification\n- Domestic Help Verification\n- Employee Verification",
        "Please enter the **Full Name** of the person being verified:",
        "Please enter the **Address** of the property / landlord:",
        "Please enter the **Mobile Number** of the candidate:",
        "Please enter the **Property Details** (e.g. flat number, city):",
      ],
      hi: [
        "कृपया **सत्यापन का प्रकार** चुनें:\n- किरायेदार सत्यापन (Tenant Verification)\n- पीजी सत्यापन (PG Verification)\n- घरेलू सहायक सत्यापन (Domestic Help)\n- कर्मचारी सत्यापन (Employee Verification)",
        "कृपया सत्यापित किए जाने वाले व्यक्ति का **पूरा नाम** दर्ज करें:",
        "कृपया मकान मालिक / संपत्ति का **पता** दर्ज करें:",
        "कृपया उम्मीदवार का **मोबाइल नंबर** दर्ज करें:",
        "कृपया **संपत्ति का विवरण** दर्ज करें (उदा. फ्लैट नंबर, शहर):",
      ],
      hinglish: [
        "Please select the **Verification Type**:\n- Tenant Verification\n- PG Verification\n- Domestic Help Verification\n- Employee Verification",
        "Satyapit kiye jaane wale vyakti ka **Full Name** likhein:",
        "Landlord ya property ka **Address** likhein:",
        "Candidate ka **Mobile Number** likhein:",
        "**Property Details** (flat number, city etc.) enter karein:",
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
      session.data.type = msg;
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
      );

      const responses = {
        en: `✅ **Verification Request Submitted!**\nYour mock Application Reference Number is: \`${resNum}\`.\n\n*Summary:*\n- **Service:** ${session.data.type}\n- **Name:** ${session.data.name}\n- **Mobile:** ${session.data.mobile}\n- **Property Address:** ${session.data.address}`,
        hi: `✅ **सत्यापन अनुरोध सबमिट किया गया!**\nआपका संदर्भ संख्या: \`${resNum}\`.\n\n*विवरण:*\n- **सेवा:** ${session.data.type}\n- **नाम:** ${session.data.name}\n- **मोबाइल:** ${session.data.mobile}\n- **संपत्ति का पता:** ${session.data.address}`,
        hinglish: `✅ **Verification request submit ho gayi hai!**\nAapka mock Application Number hai: \`${resNum}\`.\n\n*Summary:*\n- **Service:** ${session.data.type}\n- **Name:** ${session.data.name}\n- **Mobile:** ${session.data.mobile}\n- **Address:** ${session.data.address}`,
      };

      return {
        response: responses[lang],
        suggestions: ['Track Status', 'New Chat'],
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
        "Please enter your **Full Name** for the character certificate:",
        "Please enter your **Permanent Address**:",
        "Please select your **District** in Uttar Pradesh:",
        "Please enter the **Purpose** of requesting this certificate (e.g. Government Job, Private Employment, Passport):",
      ],
      hi: [
        "चरित्र प्रमाण पत्र के लिए अपना **पूरा नाम** दर्ज करें:",
        "अपना **स्थायी पता** दर्ज करें:",
        "उत्तर प्रदेश के अपने **ज़िले** का चयन करें:",
        "यह प्रमाण पत्र प्राप्त करने का **उद्देश्य** दर्ज करें (उदा. सरकारी नौकरी, निजी नौकरी, पासपोर्ट):",
      ],
      hinglish: [
        "Character Certificate ke liye apna **Full Name** likhein:",
        "Apna **Permanent Address** likhein:",
        "Uttar Pradesh ka apna **District** select karein:",
        "Certificate lene ka **Purpose** batayein (jaise: Government Job, Visa, Private Job):",
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
      );

      const responses = {
        en: `✅ **Character Certificate Application Filed!**\nYour mock Application Number is: \`${resNum}\`.\n\n*Summary:*\n- **Applicant:** ${session.data.name}\n- **District:** ${session.data.district}\n- **Purpose:** ${session.data.purpose}\n\nThis application will be processed within 15-21 working days.`,
        hi: `✅ **चरित्र प्रमाण पत्र आवेदन दायर किया गया!**\nआपका संदर्भ संख्या: \`${resNum}\`.\n\n*विवरण:*\n- **आवेदक:** ${session.data.name}\n- **ज़िला:** ${session.data.district}\n- **उद्देश्य:** ${session.data.purpose}\n\nयह आमतौर पर 15-21 दिनों में सत्यापित किया जाता है।`,
        hinglish: `✅ **Character certificate application submit ho gayi!**\nAapka Application Number hai: \`${resNum}\`.\n\n*Summary:*\n- **Name:** ${session.data.name}\n- **District:** ${session.data.district}\n- **Purpose:** ${session.data.purpose}\n\nIska completion time 15-21 working days hota hai.`,
      };

      return {
        response: responses[lang],
        suggestions: ['Track Status', 'New Chat'],
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
        "Please select the **Request Type**:\n- Event Permission\n- Procession Request\n- Protest Request\n- Film Shooting Request",
        "Please enter the **Event / Request Name**:",
        "Please enter the **Location / Route** details:",
        "Please enter the **Date** (DD/MM/YYYY):",
        "Please enter the **Expected Attendance**:",
      ],
      hi: [
        "कृपया **अनुरोध का प्रकार** चुनें:\n- कार्यक्रम अनुमति (Event Permission)\n- जुलूस अनुमति (Procession Request)\n- विरोध प्रदर्शन (Protest Request)\n- फिल्म शूटिंग (Film Shooting)",
        "कृपया कार्यक्रम / अनुरोध का **नाम** दर्ज करें:",
        "कृपया **स्थान / मार्ग** का विवरण दर्ज करें:",
        "कृपया **तिथि** दर्ज करें (DD/MM/YYYY):",
        "कृपया **संभावित उपस्थिति** की संख्या लिखें:",
      ],
      hinglish: [
        "Select the **Request Type**:\n- Event Permission\n- Procession Request\n- Protest Request\n- Film Shooting Request",
        "Event ya Request ka **Name** enter karein:",
        "Event ka **Location / Route** likhein:",
        "Event ki **Date** likhein (DD/MM/YYYY):",
        "**Expected Attendance** kitni hai?:",
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
      session.data.type = msg;
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
      );

      const responses = {
        en: `✅ **Event Permission Application Lodged!**\nYour mock Application Reference Number is: \`${resNum}\`.\n\n*Summary:*\n- **Type:** ${session.data.type}\n- **Event Name:** ${session.data.name}\n- **Date:** ${session.data.date}\n- **Expected Attendance:** ${session.data.attendance}\n\nLocal administration and traffic police will review this request.`,
        hi: `✅ **कार्यक्रम अनुमति आवेदन दर्ज!**\nआपका संदर्भ संख्या: \`${resNum}\`.\n\n*विवरण:*\n- **प्रकार:** ${session.data.type}\n- **नाम:** ${session.data.name}\n- **तिथि:** ${session.data.date}\n- **संभावित उपस्थिति:** ${session.data.attendance}\n\nस्थानीय प्रशासन और पुलिस विभाग इसका परीक्षण करेंगे।`,
        hinglish: `✅ **Event Permission request submit ho gayi hai!**\nAapka Application Number: \`${resNum}\`.\n\n*Summary:*\n- **Type:** ${session.data.type}\n- **Event:** ${session.data.name}\n- **Date:** ${session.data.date}\n- **Attendance:** ${session.data.attendance}`,
      };

      return {
        response: responses[lang],
        suggestions: ['Track Status', 'New Chat'],
      };
    }

    return { response: 'Invalid step' };
  }

  // --- Tracking Workflow ---
  private async runTrackingWorkflow(session: ChatSessionState, msg: string): Promise<{ response: string; suggestions?: string[] }> {
    const step = session.step;
    const lang = session.language;

    const prompts = {
      en: "Please enter your **Application Reference Number** (e.g. `UP-CMP-2026-001245`):",
      hi: "कृपया अपना **संदर्भ संख्या** (Reference Number) दर्ज करें (जैसे `UP-CMP-2026-001245`):",
      hinglish: "Apna **Application Reference Number** likhein (jaise `UP-CMP-2026-001245`):",
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
          en: `❌ **No application found** matching the reference number \`${msg}\`. Make sure it starts with a valid prefix (e.g., UP-CMP-, UP-VER-, UP-CER-, or UP-EVP-).`,
          hi: `❌ संदर्भ संख्या \`${msg}\` का **कोई रिकॉर्ड नहीं मिला**। कृपया सही नंबर जांचें।`,
          hinglish: `❌ \`${msg}\` reference number ka **koi application nahi mila**. Dubara check karein.`,
        };
        return {
          response: errorResponses[lang],
          suggestions: ['Track Application', 'New Chat'],
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
        'Submitted': '📥',
        'Under Review': '🔍',
        'Pending Verification': '👮',
        'Approved': '🟢',
        'Rejected': '🔴',
      };

      const responses = {
        en: `🔍 **Application Tracking Details:**\n\n- **Reference Number:** \`${trackInfo.referenceNumber}\`\n- **Service:** ${trackInfo.serviceType}\n- **Current Status:** ${statusEmojis[trackInfo.status] || ''} **${trackInfo.status}**\n- **Last Updated:** ${trackInfo.updatedAt.toLocaleString()}\n\n*Status Info:* ${statusDesc[trackInfo.status] || 'Processing.'}`,
        hi: `🔍 **आवेदन ट्रैकिंग स्थिति:**\n\n- **संदर्भ संख्या:** \`${trackInfo.referenceNumber}\`\n- **सेवा:** ${trackInfo.serviceType}\n- **वर्तमान स्थिति:** ${statusEmojis[trackInfo.status] || ''} **${trackInfo.status}**\n- **अंतिम अपडेट:** ${trackInfo.updatedAt.toLocaleString()}`,
        hinglish: `🔍 **Application tracking status:**\n\n- **Reference Number:** \`${trackInfo.referenceNumber}\`\n- **Service:** ${trackInfo.serviceType}\n- **Current Status:** ${statusEmojis[trackInfo.status] || ''} **${trackInfo.status}**\n- **Last Updated:** ${trackInfo.updatedAt.toLocaleString()}`,
      };

      return {
        response: responses[lang],
        suggestions: ['New Chat', 'Track Another Application'],
      };
    }

    return { response: 'Invalid step' };
  }
}
