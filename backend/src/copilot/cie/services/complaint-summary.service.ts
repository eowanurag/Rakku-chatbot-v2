import { Injectable } from '@nestjs/common';
import { IncidentItem, IncidentContainer, IncidentItemService } from './incident-item.service';
import { ComplaintPriorityService } from './complaint-priority.service';
import { SreRecommendationsService } from '../../sre/services/sre-recommendations.service';

export interface OfficerHandoffPackage {
  citizenDetails: string;
  incidentSummary: string;
  keyFacts: string;
  riskIndicators: string;
  attachments: string;
  recommendations: string;
  rawText: string;
  secondaryRecommendations?: string[];
  lostItemContents?: string;
  // Dynamic parameters V2.8.5
  incidentItems?: IncidentItem[];
  containers?: IncidentContainer[];
  primaryComplaintType?: string;
  secondaryComplaintTypes?: string[];
  supportingItems?: any;
  incidentType?: string;
  risk?: any;
  statistics?: any;
  officerAlerts?: string[];
}

@Injectable()
export class ComplaintSummaryService {
  private readonly itemService = new IncidentItemService();
  private readonly priorityService = new ComplaintPriorityService();
  private readonly sreService = new SreRecommendationsService();

  public generateHandoffPackage(
    citizen: { fullName: string; mobileNumber: string; email?: string; city?: string; district?: string },
    complaint: { complaintType: string; incidentDetails: string; status: string; createdAt: Date | string },
    entities: Record<string, any> = {},
    riskLevel: string = 'LOW',
    attachmentsList: string[] = [],
    recs: string[] = [],
    secondaryRecommendations: string[] = [],
    lostItemContents?: string,
    submissionSnapshot?: any,
    incidentItems: IncidentItem[] = [],
    containers: IncidentContainer[] = []
  ): OfficerHandoffPackage {
    
    // Stable hash caching check
    if (submissionSnapshot && submissionSnapshot.incidentHash) {
      const computedHash = this.itemService.computeIncidentHash(incidentItems);
      if (submissionSnapshot.incidentHash === computedHash && (complaint as any).cachedHandoffPackage) {
        return (complaint as any).cachedHandoffPackage;
      }
    }

    const priorityRes = this.priorityService.resolveComplaintPriority(incidentItems, complaint.incidentDetails);
    const stats = this.priorityService.buildStatistics(incidentItems);
    const supporting = this.priorityService.getSupportingItems(incidentItems);
    const alerts = this.priorityService.getOfficerAlerts(incidentItems);

    const detailsStr = `Name: ${citizen.fullName}
Mobile: ${citizen.mobileNumber}
Email: ${citizen.email || 'N/A'}
District/City: ${citizen.district || 'N/A'}, ${citizen.city || 'N/A'}`;

    const incidentStr = `Type: ${priorityRes.primaryComplaintType}
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

    const riskStr = `Assessed Risk: ${priorityRes.risk.level} (Score: ${priorityRes.risk.score})
Classification: ${priorityRes.risk.level === 'CRITICAL' ? 'CRITICAL ACTIONS PENDING' : (priorityRes.risk.level === 'HIGH' ? 'IMMEDIATE ACTION RECOMMENDED' : 'STANDARD ROUTING')}
Reasons: ${priorityRes.risk.reasons.join(', ') || 'None'}`;

    const attachStr = attachmentsList.length > 0 ? attachmentsList.join(', ') : 'No attachments uploaded.';

    const structuredRecs = this.sreService.getStructuredRecommendations(incidentItems, {});
    const combinedRecs = [...recs];
    structuredRecs.immediateRecommendations.forEach(r => combinedRecs.push(r.code));
    structuredRecs.importantRecommendations.forEach(r => combinedRecs.push(r.code));
    structuredRecs.informationalRecommendations.forEach(r => combinedRecs.push(r.code));

    if (secondaryRecommendations && secondaryRecommendations.length > 0) {
      for (const r of secondaryRecommendations) {
        if (!combinedRecs.includes(r)) {
          combinedRecs.push(r);
        }
      }
    }
    const recsStr = combinedRecs.length > 0 ? combinedRecs.map((r, i) => `${i + 1}. ${r}`).join('\n') : 'No recommendations available.';

    let rawText = `=== OFFICER HANDOFF PACKAGE ===
[Citizen Details]
${detailsStr}

[Incident Summary]
${incidentStr}
`;

    if (lostItemContents) {
      rawText += `Lost Container Contents: ${lostItemContents}\n`;
    }

    if (containers.length > 0) {
      rawText += `\n[Container Relationships]\n`;
      containers.forEach(c => {
        rawText += `- ID: ${c.containerId}, Type: ${c.type}, Owner: ${c.owner}, Confidence: ${c.containerConfidence}\n`;
      });
    }

    if (incidentItems.length > 0) {
      rawText += `\n[Incident Items]\n`;
      incidentItems.forEach(i => {
        rawText += `- Code: ${i.itemCode}, Qty: ${i.quantity || 1}, Owner: ${i.owner}, Relationship: ${i.relationship || 'SEPARATE_ITEM'}\n`;
      });
    }

    if (alerts.length > 0) {
      rawText += `\n[Officer Alerts]\n${alerts.map(a => `⚠️ Alert: ${a}`).join('\n')}\n`;
    }

    rawText += `
[Key Facts]
${keyFactsStr}

[Risk Indicators]
${riskStr}

[Attachments]
${attachStr}

[Recommendations]
${recsStr}
===============================`;

    const handoffPackage: OfficerHandoffPackage = {
      citizenDetails: detailsStr,
      incidentSummary: incidentStr,
      keyFacts: keyFactsStr,
      riskIndicators: riskStr,
      attachments: attachStr,
      recommendations: recsStr,
      rawText,
      secondaryRecommendations,
      lostItemContents,
      incidentItems,
      containers,
      primaryComplaintType: priorityRes.primaryComplaintType,
      secondaryComplaintTypes: priorityRes.secondaryComplaintTypes,
      supportingItems: supporting,
      incidentType: priorityRes.incidentType,
      risk: priorityRes.risk,
      statistics: stats,
      officerAlerts: alerts
    };

    // Cache the package onto the complaint object
    (complaint as any).cachedHandoffPackage = handoffPackage;

    return handoffPackage;
  }
}
