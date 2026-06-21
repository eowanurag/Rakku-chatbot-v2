import { ExtractedFact, IncidentModel, PropertyEntity } from '../interfaces/complaint-intelligence.interface';

export class RegexFactExtractor {
  public extract(text: string, incidentType: string): { facts: ExtractedFact[]; model: Partial<IncidentModel> } {
    const facts: ExtractedFact[] = [];
    const model: Partial<IncidentModel> = {
      property: [],
      evidence: [],
      people: []
    };

    // 1. Vehicle Plate Matching (e.g. UP32AB1234, MH12CD4567, etc.)
    const vehicleRegex = /\b([A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4})\b/i;
    const vehicleMatch = text.match(vehicleRegex);
    if (vehicleMatch) {
      const plate = vehicleMatch[1].toUpperCase();
      facts.push({
        field: 'vehicle_plate',
        value: plate,
        confidence: 0.99,
        source: 'USER'
      });
      model.property!.push({
        type: 'VEHICLE',
        brand: 'Unknown Vehicle',
        model: 'Plate: ' + plate,
        serialNumber: plate
      });
    }

    // 2. Phone Number Matching (10 digits, optional country code)
    const phoneRegex = /\b(?:\+91|91)?[6-9][0-9]{9}\b/;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
      const phone = phoneMatch[0];
      facts.push({
        field: 'phone_number',
        value: phone,
        confidence: 0.99,
        source: 'USER'
      });
      model.evidence!.push({
        type: 'PHONE_NUMBER',
        value: phone,
        description: 'Extracted contact phone number'
      });
    }

    // 3. Aadhaar Card Matching (12 digits, optional spaces)
    const aadhaarRegex = /\b[2-9][0-9]{3}\s?[0-9]{4}\s?[0-9]{4}\b/;
    const aadhaarMatch = text.match(aadhaarRegex);
    if (aadhaarMatch) {
      const card = aadhaarMatch[0].replace(/\s/g, '');
      facts.push({
        field: 'document_id_aadhaar',
        value: card,
        confidence: 0.99,
        source: 'USER'
      });
      model.property!.push({
        type: 'DOCUMENT',
        brand: 'UIDAI',
        model: 'Aadhaar Card',
        serialNumber: card
      });
    }

    // 4. PAN Card Matching (e.g. ABCDE1234F)
    const panRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/i;
    const panMatch = text.match(panRegex);
    if (panMatch) {
      const card = panMatch[0].toUpperCase();
      facts.push({
        field: 'document_id_pan',
        value: card,
        confidence: 0.99,
        source: 'USER'
      });
      model.property!.push({
        type: 'DOCUMENT',
        brand: 'Income Tax Dept',
        model: 'PAN Card',
        serialNumber: card
      });
    }

    // 5. Date Matching
    // Matches formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
    const numericDateRegex = /\b(?:(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})|(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2}))\b/;
    const numericDateMatch = text.match(numericDateRegex);
    if (numericDateMatch) {
      const matchedDate = numericDateMatch[0];
      facts.push({
        field: 'incident_date',
        value: matchedDate,
        confidence: 0.99,
        source: 'USER'
      });
      model.incidentDate = matchedDate;
    } else {
      // Named Month match e.g. "12 March 2026", "March 12, 2026"
      const namedMonthRegex = /\b(?:\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/i;
      const namedMonthMatch = text.match(namedMonthRegex);
      if (namedMonthMatch) {
        const matchedDate = namedMonthMatch[0];
        facts.push({
          field: 'incident_date',
          value: matchedDate,
          confidence: 0.99,
          source: 'USER'
        });
        model.incidentDate = matchedDate;
      }
    }

    return { facts, model };
  }
}
