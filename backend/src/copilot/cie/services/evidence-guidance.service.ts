import { Injectable } from '@nestjs/common';

export interface EvidenceGuidanceItem {
  complaintType: string;
  recommendedDocs: string[];
}

@Injectable()
export class EvidenceGuidanceService {
  public getGuidance(complaintType: string): EvidenceGuidanceItem | null {
    if (!complaintType) return null;
    const typeUpper = complaintType.toUpperCase().replace(/\s+/g, '_');

    if (typeUpper.includes('LOST_MOBILE')) {
      return {
        complaintType: 'LOST_MOBILE',
        recommendedDocs: ['IMEI', 'Purchase Bill']
      };
    } else if (typeUpper.includes('CYBER_FRAUD') || typeUpper.includes('CYBER')) {
      return {
        complaintType: 'CYBER_FRAUD',
        recommendedDocs: ['Transaction Screenshot', 'SMS Screenshot']
      };
    } else if (typeUpper.includes('MISSING_PERSON') || typeUpper.includes('MISSING')) {
      return {
        complaintType: 'MISSING_PERSON',
        recommendedDocs: ['Photograph', 'Last Seen Details']
      };
    }

    return null;
  }
}
