import axios from 'axios';
import { ExtractedFact, FactSource, IncidentModel, PropertyEntity, PersonEntity } from '../interfaces/complaint-intelligence.interface';
import { RegexFactExtractor } from '../extractors/regex-fact-extractor';

export class FactExtractor {
  private apiKey: string;
  private regexExtractor: RegexFactExtractor;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.regexExtractor = new RegexFactExtractor();
  }

  public async extract(text: string, incidentType: string): Promise<{ facts: ExtractedFact[]; model: Partial<IncidentModel> }> {
    const cleanText = text.toLowerCase();
    
    // 1. Run Regex Fact Extraction first (Highest Precedence)
    const { facts: regexFacts, model: regexModel } = this.regexExtractor.extract(text, incidentType);
    
    const facts: ExtractedFact[] = [...regexFacts];
    const model: Partial<IncidentModel> = {
      narrative: text,
      people: regexModel.people || [],
      property: regexModel.property || [],
      evidence: regexModel.evidence || [],
      timelineEvents: regexModel.timelineEvents || [],
      incidentDate: regexModel.incidentDate,
      incidentLocation: regexModel.incidentLocation
    };

    // Helper to check if a field was already extracted by a higher-precedence source
    const isFieldExtractedByRegex = (field: string) => regexFacts.some(f => f.field === field);

    // 2. Run Local Rule-based heuristics (Medium Precedence)
    // Phone brand / property extraction
    const brandMatch = cleanText.match(/\b(samsung|iphone|apple|xiaomi|redmi|realme|oneplus|vivo|oppo|nokia)\b/i);
    if (brandMatch && !isFieldExtractedByRegex('property_brand')) {
      const brand = brandMatch[1].charAt(0).toUpperCase() + brandMatch[1].slice(1).toLowerCase();
      facts.push({
        field: 'property_brand',
        value: brand,
        confidence: 0.99,
        source: 'USER'
      });
      // Only add to model property if not already matched by vehicle / document from regex
      const hasPhoneProperty = model.property!.some(p => p.type === 'PHONE');
      if (!hasPhoneProperty) {
        model.property!.push({
          type: 'PHONE',
          brand,
          model: 'Unknown Model'
        });
      }
    }

    // Documents rules
    if (cleanText.includes('aadhaar') && !isFieldExtractedByRegex('document_type')) {
      facts.push({ field: 'document_type', value: 'Aadhaar', confidence: 0.99, source: 'USER' });
      const hasAadhaar = model.property!.some(p => p.type === 'DOCUMENT' && p.model === 'Aadhaar Card');
      if (!hasAadhaar) {
        model.property!.push({ type: 'DOCUMENT', brand: 'UIDAI', model: 'Aadhaar Card' });
      }
    } else if (cleanText.includes('passport') && !isFieldExtractedByRegex('document_type')) {
      facts.push({ field: 'document_type', value: 'Passport', confidence: 0.99, source: 'USER' });
      const hasPassport = model.property!.some(p => p.type === 'DOCUMENT' && p.model === 'Passport');
      if (!hasPassport) {
        model.property!.push({ type: 'DOCUMENT', brand: 'Govt of India', model: 'Passport' });
      }
    }

    // Suspect rules
    if ((cleanText.includes('suspect') || cleanText.includes('chor') || cleanText.includes('boys') || cleanText.includes('snatched')) && !isFieldExtractedByRegex('suspect_presence')) {
      facts.push({ field: 'suspect_presence', value: 'Yes', confidence: 0.85, source: 'INFERRED' });
      if (model.people!.length === 0) {
        model.people!.push({
          role: 'SUSPECT',
          description: cleanText.includes('two boys') ? 'Two boys' : 'Unknown suspect'
        });
      }
    }

    // 3. Fallback to Gemini AI if API key is present and AI is enabled
    const isAiDisabled = process.env.AI_DISABLED === 'true';
    if (this.apiKey && !isAiDisabled) {
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
          { headers: { 'Content-Type': 'application/json' }, timeout: 5000 }
        );

        const contentText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (contentText) {
          const parsed = JSON.parse(contentText);
          if (parsed.extractedFacts) {
            for (const aiFact of parsed.extractedFacts) {
              // Rule precedence: AI CANNOT override facts already set by Regex or local Rules
              const hasExistingFact = facts.some(f => f.field === aiFact.field);
              if (!hasExistingFact) {
                facts.push(aiFact);
              }
            }
          }

          // Merge people if AI found additional details
          if (parsed.people && parsed.people.length > 0) {
            for (const aiPerson of parsed.people) {
              const duplicate = model.people!.some(p => p.role === aiPerson.role && (p.name === aiPerson.name || p.description === aiPerson.description));
              if (!duplicate) {
                model.people!.push(aiPerson);
              }
            }
          }

          // Merge property details (AI can enrich, but cannot overwrite deterministic properties from regex/rules)
          if (parsed.property && parsed.property.length > 0) {
            for (const aiProperty of parsed.property) {
              const matchingPropIndex = model.property!.findIndex(p => p.type === aiProperty.type);
              if (matchingPropIndex !== -1) {
                const currentProp = model.property![matchingPropIndex];
                // Enrich missing details without overwriting existing non-null properties
                currentProp.brand = currentProp.brand && currentProp.brand !== 'Unknown Vehicle' && currentProp.brand !== 'Unknown Brand' ? currentProp.brand : aiProperty.brand;
                currentProp.model = currentProp.model && !currentProp.model.startsWith('Plate:') && currentProp.model !== 'Unknown Model' ? currentProp.model : aiProperty.model;
                currentProp.color = currentProp.color || aiProperty.color;
                currentProp.serialNumber = currentProp.serialNumber || aiProperty.serialNumber;
              } else {
                model.property!.push(aiProperty);
              }
            }
          }
        }
      } catch (e: any) {
        console.error('Gemini FactExtractor error (falling back deterministically):', e?.message || e);
      }
    }

    return { facts, model };
  }
}
