import axios from 'axios';
import { ExtractedFact, FactSource, IncidentModel, PropertyEntity, PersonEntity } from '../interfaces/complaint-intelligence.interface';

export class FactExtractor {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
  }

  public async extract(text: string, incidentType: string): Promise<{ facts: ExtractedFact[]; model: Partial<IncidentModel> }> {
    const cleanText = text.toLowerCase();
    const facts: ExtractedFact[] = [];
    const model: Partial<IncidentModel> = {
      narrative: text,
      people: [],
      property: [],
      evidence: [],
      timelineEvents: []
    };

    // 1. Local Rule-based heuristics for quick parsing
    // Phone brand / property extraction
    const brandMatch = cleanText.match(/\b(samsung|iphone|apple|xiaomi|redmi|realme|oneplus|vivo|oppo|nokia)\b/i);
    if (brandMatch) {
      const brand = brandMatch[1].charAt(0).toUpperCase() + brandMatch[1].slice(1).toLowerCase();
      facts.push({
        field: 'property_brand',
        value: brand,
        confidence: 0.99,
        source: 'USER'
      });
      model.property!.push({
        type: 'PHONE',
        brand,
        model: 'Unknown Model'
      });
    }

    // Documents
    if (cleanText.includes('aadhaar')) {
      facts.push({ field: 'document_type', value: 'Aadhaar', confidence: 0.99, source: 'USER' });
      model.property!.push({ type: 'DOCUMENT', brand: 'UIDAI', model: 'Aadhaar Card' });
    } else if (cleanText.includes('passport')) {
      facts.push({ field: 'document_type', value: 'Passport', confidence: 0.99, source: 'USER' });
      model.property!.push({ type: 'DOCUMENT', brand: 'Govt of India', model: 'Passport' });
    }

    // Suspect detection
    if (cleanText.includes('suspect') || cleanText.includes('chor') || cleanText.includes('boys') || cleanText.includes('snatched')) {
      facts.push({ field: 'suspect_presence', value: 'Yes', confidence: 0.85, source: 'INFERRED' });
      model.people!.push({
        role: 'SUSPECT',
        description: cleanText.includes('two boys') ? 'Two boys' : 'Unknown suspect'
      });
    }

    // 2. Fallback to Gemini if API key is present for complex extraction
    if (this.apiKey) {
      const prompt = `
Extract details from this complaint narrative for incident type "${incidentType}".
Return a JSON object containing:
{
  "extractedFacts": [
    {
      "field": string, // e.g. "property_brand", "property_model", "incident_location", "incident_date", "suspect_description"
      "value": string,
      "confidence": number, // Float between 0.0 and 1.0
      "source": "USER" | "INFERRED" | "AI"
    }
  ],
  "people": [
    {
      "name": string, // optional
      "role": "VICTIM" | "SUSPECT" | "WITNESS",
      "description": string, // optional
      "contact": string // optional
    }
  ],
  "property": [
    {
      "type": string, // e.g. "PHONE", "DOCUMENT", "BIKE"
      "brand": string,
      "model": string,
      "color": string,
      "serialNumber": string
    }
  ]
}

Narrative: "${text}"
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
          { headers: { 'Content-Type': 'application/json' } }
        );

        const contentText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (contentText) {
          const parsed = JSON.parse(contentText);
          if (parsed.extractedFacts) {
            // Merge or override with AI extracted facts
            for (const fact of parsed.extractedFacts) {
              const existingIdx = facts.findIndex(f => f.field === fact.field);
              if (existingIdx !== -1) {
                facts[existingIdx] = fact;
              } else {
                facts.push(fact);
              }
            }
          }
          if (parsed.people && parsed.people.length > 0) {
            model.people = parsed.people;
          }
          if (parsed.property && parsed.property.length > 0) {
            model.property = parsed.property;
          }
        }
      } catch (e: any) {
        console.error('Gemini FactExtractor error:', e?.message || e);
      }
    }

    return { facts, model };
  }
}
