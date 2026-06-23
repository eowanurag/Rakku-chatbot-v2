import { Injectable } from '@nestjs/common';

@Injectable()
export class SreRecommendationsService {
  public getRecommendations(workflow: string, contextData: any = {}): string[] {
    const recs: string[] = [];
    const lowerWorkflow = (workflow || '').toLowerCase().replace(/\s+/g, '_');

    const lowerText = String(contextData.narrative || '').toLowerCase();
    const hasTransactions = lowerText.includes('transaction') || lowerText.includes('bank') || lowerText.includes('upi') || lowerText.includes('fraud') || lowerText.includes('money');

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
    } else {
      recs.push('Track Application');
    }

    return recs;
  }
}
