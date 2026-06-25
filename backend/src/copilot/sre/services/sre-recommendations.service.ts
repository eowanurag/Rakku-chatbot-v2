import { Injectable } from '@nestjs/common';
import { RECOMMENDATION_RULES, RecommendationToken } from '../config/incident-item-recommendation.config';
import { IncidentItemCode } from '../../cie/config/incident-item-risk.config';
import { MAX_CRITICAL_RECOMMENDATIONS, MAX_HIGH_RECOMMENDATIONS, MAX_LOW_RECOMMENDATIONS } from '../../workflow.config';

@Injectable()
export class SreRecommendationsService {
  public getRecommendations(workflow: string, contextData: any = {}): string[] {
    const recs: string[] = [];
    const lowerWorkflow = (workflow || '').toLowerCase().replace(/\s+/g, '_');
    const lowerText = String(contextData.narrative || '').toLowerCase();
    const hasTransactions = lowerText.includes('transaction') || lowerText.includes('bank') || lowerText.includes('upi') || lowerText.includes('fraud') || lowerText.includes('money');

    // Backward compatibility rule logic
    if (lowerWorkflow.includes('lost_passport') || lowerText.includes('passport')) {
      recs.push('Passport Reissue Guidance');
    } else if (lowerWorkflow.includes('lost_mobile') || lowerWorkflow.includes('lost_phone')) {
      if (hasTransactions) {
        recs.push('Block SIM');
        recs.push('Cyber Fraud Complaint');
        recs.push('Bank Freeze Guidance');
      } else {
        recs.push('Block SIM');
        recs.push('Track Complaint');
        recs.push('Cyber Fraud Complaint');
      }
    } else if (lowerWorkflow.includes('cyber_fraud') || lowerWorkflow.includes('cyber')) {
      recs.push('Call 1930');
      recs.push('Freeze Bank Account');
      recs.push('Upload transaction details');
    } else if (lowerWorkflow.includes('tenant') || lowerWorkflow.includes('tenant_verification')) {
      recs.push('Character Certificate');
    } else if (lowerWorkflow.includes('lost_document')) {
      recs.push('Track Application');
    } else if (lowerWorkflow.includes('lost_property')) {
      recs.push('Track Application');
    } else {
      recs.push('Track Application');
    }

    // Append context-provided secondary recommendations if they exist
    if (contextData && Array.isArray(contextData.secondaryRecommendations)) {
      for (const r of contextData.secondaryRecommendations) {
        if (!recs.includes(r)) {
          recs.push(r);
        }
      }
    }

    return recs;
  }

  public getStructuredRecommendations(
    items: { itemCode: IncidentItemCode }[],
    intelligenceObj: any = {}
  ): {
    immediateRecommendations: any[];
    importantRecommendations: any[];
    informationalRecommendations: any[];
    requiresReissueGuidance: boolean;
  } {
    const itemCodes = items.map(i => i.itemCode);
    const triggeredRules = RECOMMENDATION_RULES.filter(rule => {
      if (rule.triggers.length === 0) return false;
      return rule.triggers.some(t => itemCodes.includes(t));
    });

    const immediateList: any[] = [];
    const importantList: any[] = [];
    const informationalList: any[] = [];
    const reasoningTrace: any[] = [];

    for (const rule of triggeredRules) {
      const payload = {
        code: rule.code,
        priority: rule.priority,
        version: rule.version,
        triggers: rule.triggers.filter(t => itemCodes.includes(t)),
        severity: rule.severity
      };

      // Find the key of the enum corresponding to rule.code
      const enumKey = Object.keys(RecommendationToken).find(
        key => RecommendationToken[key as keyof typeof RecommendationToken] === rule.code
      ) || rule.code;

      // Add to reasoning trace in structured format
      reasoningTrace.push({
        token: enumKey,
        reasons: payload.triggers
      });

      if (rule.priority === 'CRITICAL') {
        immediateList.push(payload);
      } else if (rule.priority === 'HIGH') {
        importantList.push(payload);
      } else {
        informationalList.push(payload);
      }
    }

    // Always append fallback TRACK_COMPLAINT_STATUS to informational if empty
    if (informationalList.length === 0) {
      const fallbackRule = RECOMMENDATION_RULES.find(r => r.code === RecommendationToken.TRACK_COMPLAINT_STATUS)!;
      informationalList.push({
        code: RecommendationToken.TRACK_COMPLAINT_STATUS,
        priority: 'LOW',
        version: 1,
        triggers: [],
        severity: 'INFO'
      });
    }

    // Limit lists
    const immediateRecommendations = immediateList.slice(0, MAX_CRITICAL_RECOMMENDATIONS);
    const importantRecommendations = importantList.slice(0, MAX_HIGH_RECOMMENDATIONS);
    const informationalRecommendations = informationalList.slice(0, MAX_LOW_RECOMMENDATIONS);

    // Save recommendation trace
    intelligenceObj.recommendationReasoning = reasoningTrace;

    const requiresReissueGuidance = items.some(i => 
      ['AADHAAR_CARD', 'PAN_CARD', 'DRIVING_LICENSE', 'PASSPORT', 'VEHICLE_RC'].includes(i.itemCode)
    );

    return {
      immediateRecommendations,
      importantRecommendations,
      informationalRecommendations,
      requiresReissueGuidance
    };
  }
}

