import { Injectable } from '@nestjs/common';

export interface OfficerHandoffPackage {
  citizenDetails: string;
  incidentSummary: string;
  keyFacts: string;
  riskIndicators: string;
  attachments: string;
  recommendations: string;
  rawText: string;
}

@Injectable()
export class ComplaintSummaryService {
  public generateHandoffPackage(
    citizen: { fullName: string; mobileNumber: string; email?: string; city?: string; district?: string },
    complaint: { complaintType: string; incidentDetails: string; status: string; createdAt: Date | string },
    entities: Record<string, any> = {},
    riskLevel: string = 'LOW',
    attachmentsList: string[] = [],
    recs: string[] = []
  ): OfficerHandoffPackage {
    
    const detailsStr = `Name: ${citizen.fullName}
Mobile: ${citizen.mobileNumber}
Email: ${citizen.email || 'N/A'}
District/City: ${citizen.district || 'N/A'}, ${citizen.city || 'N/A'}`;

    const incidentStr = `Type: ${complaint.complaintType}
Status: ${complaint.status}
Filed At: ${new Date(complaint.createdAt).toLocaleString()}
Description: ${complaint.incidentDetails}`;

    const factsList: string[] = [];
    for (const [k, v] of Object.entries(entities)) {
      if (v) {
        factsList.push(`${k}: ${v}`);
      }
    }
    const keyFactsStr = factsList.length > 0 ? factsList.join('\n') : 'No structured entities extracted.';

    const riskStr = `Assessed Risk: ${riskLevel}
Classification: ${riskLevel === 'HIGH' ? 'IMMEDIATE ACTION RECOMMENDED' : 'STANDARD ROUTING'}`;

    const attachStr = attachmentsList.length > 0 ? attachmentsList.join(', ') : 'No attachments uploaded.';

    const recsStr = recs.length > 0 ? recs.map((r, i) => `${i + 1}. ${r}`).join('\n') : 'No recommendations available.';

    const rawText = `=== OFFICER HANDOFF PACKAGE ===
[Citizen Details]
${detailsStr}

[Incident Summary]
${incidentStr}

[Key Facts]
${keyFactsStr}

[Risk Indicators]
${riskStr}

[Attachments]
${attachStr}

[Recommendations]
${recsStr}
===============================`;

    return {
      citizenDetails: detailsStr,
      incidentSummary: incidentStr,
      keyFacts: keyFactsStr,
      riskIndicators: riskStr,
      attachments: attachStr,
      recommendations: recsStr,
      rawText
    };
  }
}
