import { Injectable } from '@nestjs/common';

@Injectable()
export class ComplaintQualityService {
  public calculateQualityScore(complaintType: string, details: string, providedFields: Record<string, any> = {}): { score: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT'; numericScore: number; details: string[] } {
    const typeUpper = (complaintType || '').toUpperCase().replace(/\s+/g, '_');
    const reasons: string[] = [];
    let baseScore = 40; // baseline

    // Evaluate details length and content
    const cleanDetails = (details || '').trim();
    if (cleanDetails.length === 0) {
      baseScore -= 20;
      reasons.push('Incident description is completely missing.');
    } else if (cleanDetails.length < 20) {
      baseScore += 5;
      reasons.push('Incident description is too brief (less than 20 characters).');
    } else if (cleanDetails.length < 100) {
      baseScore += 15;
      reasons.push('Incident description has moderate detail.');
    } else {
      baseScore += 30;
      reasons.push('Incident description has rich descriptive details.');
    }

    // Evaluate based on field presence
    const normalizedData: Record<string, any> = {};
    for (const key of Object.keys(providedFields)) {
      normalizedData[key.toLowerCase()] = providedFields[key];
    }

    // Check specific fields based on type
    if (typeUpper === 'LOST_MOBILE') {
      const hasIMEI = !!(normalizedData['imei'] || normalizedData['imeinumber']);
      const hasModel = !!(normalizedData['mobilemodel'] || normalizedData['model']);
      const hasLastSeen = !!(normalizedData['lastseen'] || normalizedData['incident_location']);

      if (hasIMEI) {
        baseScore += 15;
      } else {
        reasons.push('Missing IMEI identifier.');
      }
      if (hasModel) {
        baseScore += 10;
      } else {
        reasons.push('Missing Mobile Model details.');
      }
      if (hasLastSeen) {
        baseScore += 10;
      } else {
        reasons.push('Missing Last Seen Location.');
      }
    } else if (typeUpper === 'CYBER_FRAUD') {
      const hasTxId = !!(normalizedData['transactionid'] || normalizedData['transaction_id']);
      const hasBank = !!(normalizedData['bank'] || normalizedData['bank_name']);
      const hasUPI = !!(normalizedData['upi'] || normalizedData['upi_id']);

      if (hasTxId) {
        baseScore += 15;
      } else {
        reasons.push('Missing Transaction ID.');
      }
      if (hasBank) {
        baseScore += 10;
      } else {
        reasons.push('Missing Bank details.');
      }
      if (hasUPI) {
        baseScore += 10;
      }
    } else if (typeUpper === 'MISSING_PERSON') {
      const hasLastSeen = !!(normalizedData['lastseen'] || normalizedData['lastseenlocation']);
      const hasClothing = !!(normalizedData['clothing'] || normalizedData['clothingdescription']);
      const hasPhoto = !!(normalizedData['photograph'] || normalizedData['photo']);

      if (hasLastSeen) {
        baseScore += 15;
      } else {
        reasons.push('Missing Last Seen Location.');
      }
      if (hasClothing) {
        baseScore += 10;
      } else {
        reasons.push('Missing Clothing description.');
      }
      if (hasPhoto) {
        baseScore += 10;
      }
    } else {
      // General checks
      if (Object.keys(normalizedData).length > 2) {
        baseScore += 20;
      } else {
        reasons.push('Limited supporting parameters provided.');
      }
    }

    const finalScore = Math.min(100, Math.max(0, baseScore));
    let rating: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT' = 'POOR';

    if (finalScore >= 85) {
      rating = 'EXCELLENT';
    } else if (finalScore >= 70) {
      rating = 'GOOD';
    } else if (finalScore >= 50) {
      rating = 'FAIR';
    }

    return {
      score: rating,
      numericScore: finalScore,
      details: reasons.length > 0 ? reasons : ['All standard quality indicators met.']
    };
  }
}
