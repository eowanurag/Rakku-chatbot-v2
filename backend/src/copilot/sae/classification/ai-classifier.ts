import axios from 'axios';
import { LegacyIntentAdapter } from '../adapters/legacy-intent-adapter';

export class AiClassifier {
  private apiKey: string;
  private adapter: LegacyIntentAdapter;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.adapter = new LegacyIntentAdapter();
  }

  public async classify(text: string): Promise<any> {
    if (!this.apiKey) {
      console.warn('Gemini API key is not configured. AI classification fallback will return UNKNOWN.');
      return this.getUnknownResponse();
    }

    const prompt = `
You are a Situation Assessment Engine for the Uttar Pradesh Police Citizen Services assistant.
Analyze the following citizen report and return a structured JSON response.

Supported Intents:
- LOST_MOBILE
- LOST_DOCUMENT
- CYBER_FRAUD
- FINANCIAL_FRAUD
- HARASSMENT
- THREAT
- WOMEN_SAFETY
- MISSING_PERSON
- PROPERTY_THEFT
- VEHICLE_THEFT
- TENANT_VERIFICATION
- EMPLOYEE_VERIFICATION
- DOMESTIC_HELP_VERIFICATION
- CHARACTER_CERTIFICATE
- EVENT_PERMISSION
- APPLICATION_TRACKING
- POLICE_STATION_LOOKUP
- EMERGENCY_HELP
- GENERAL_GUIDANCE
- UNKNOWN

Supported Incident Categories:
- LOST_PROPERTY
- THEFT
- FRAUD
- HARASSMENT
- VERIFICATION
- CERTIFICATE
- PERMISSION
- TRACKING
- GUIDANCE

Urgency Levels:
- LOW (Certificate requests, tracking, generic queries)
- MEDIUM (Lost mobile, property/vehicle theft, verifications)
- HIGH (Cyber fraud, threats, active harassment)
- CRITICAL (Kidnapping, assault, danger, safety alerts)

Output structured JSON matching this schema:
{
  "intent": string, // One of the Supported Intents
  "incidentCategory": string, // One of the Supported Incident Categories
  "recommendedServices": string[], // Choose from COMPLAINT, LOST_DOCUMENT_REPORT, TENANT_VERIFICATION, EMPLOYEE_VERIFICATION, DOMESTIC_HELP_VERIFICATION, CHARACTER_CERTIFICATE, EVENT_PERMISSION, APPLICATION_TRACKING, POLICE_STATION_LOOKUP, EMERGENCY_HELPLINES, CYBER_COMPLAINT, CYBER_HELPLINE
  "recommendedActions": string[], // List of helpful actions for this context
  "confidence": number, // Float between 0.0 and 1.0 (intent confidence)
  "confidenceBand": "LOW" | "MEDIUM" | "HIGH", // LOW (0.0-0.69), MEDIUM (0.70-0.89), HIGH (0.90-1.00)
  "recommendationConfidence": number, // Float between 0.0 and 1.0 (recommendation confidence)
  "recommendationConfidenceBand": "LOW" | "MEDIUM" | "HIGH",
  "urgency": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "storyCompleteness": number, // Float between 0.0 and 1.0 (completeness of key details like location, timeline, etc.)
  "detectedEntities": {
    "locations": string[],
    "dates": string[],
    "people": string[],
    "property": string[]
  },
  "reasoning": string[],
  "requiresClarification": boolean, // true if confidence < 0.70 or intent is UNKNOWN or key info is missing
  "missingInformation": [
    {
      "field": string,
      "reason": string,
      "priority": "LOW" | "MEDIUM" | "HIGH"
    }
  ]
}

Citizen Report: "${text}"
`;

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const contentText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (contentText) {
        const parsed = JSON.parse(contentText);
        parsed.scenarioHints = parsed.scenarioHints || (parsed.intent ? this.adapter.adapt(parsed.intent) : []);
        parsed.hintSource = parsed.hintSource || ["AI_CLASSIFIER"];
        parsed.legacyIntent = parsed.legacyIntent || parsed.intent || "UNKNOWN";
        return parsed;
      }
    } catch (e: any) {
      console.error('Error invoking Gemini in AiClassifier:', e?.message || e);
      throw e;
    }

    return this.getUnknownResponse();
  }

  private getUnknownResponse() {
    return {
      intent: 'UNKNOWN',
      incidentCategory: 'GUIDANCE',
      recommendedServices: ['GENERAL_GUIDANCE'],
      recommendedActions: ['Provide more details of your situation'],
      confidence: 0.5,
      confidenceBand: 'LOW',
      recommendationConfidence: 0.5,
      recommendationConfidenceBand: 'LOW',
      urgency: 'LOW',
      storyCompleteness: 0.1,
      detectedEntities: { locations: [], dates: [], people: [], property: [] },
      reasoning: ['Could not verify narrative context securely via AI.'],
      requiresClarification: true,
      clarificationType: 'SERVICE_SELECTION',
      clarificationPrompt: "I'd like to understand your situation better. Could you tell me a little more about what happened?",
      missingInformation: [
        { field: 'narrative_details', reason: 'Initial context is too ambiguous', priority: 'HIGH' }
      ],
      scenarioHints: [],
      hintSource: ["AI_CLASSIFIER"],
      legacyIntent: 'UNKNOWN'
    };
  }
}
