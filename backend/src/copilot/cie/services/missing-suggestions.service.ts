import { Injectable } from '@nestjs/common';

@Injectable()
export class MissingSuggestionsService {
  public getSuggestions(incidentType: string, missingFields: string[]): string[] {
    const suggestions: string[] = [];
    
    if (incidentType === 'LOST_MOBILE') {
      if (missingFields.includes('imei')) {
        suggestions.push('IMEI Number');
      }
      if (missingFields.includes('incident_location')) {
        suggestions.push('Last Seen Location');
      }
      if (missingFields.includes('incident_date')) {
        suggestions.push('Approximate Time');
      }
    } else if (incidentType === 'CYBER_FRAUD') {
      if (missingFields.includes('transaction_id')) {
        suggestions.push('Transaction ID');
      }
      if (missingFields.includes('bank_name')) {
        suggestions.push('Bank Name');
      }
      if (missingFields.includes('financialLoss') || missingFields.includes('financial_loss')) {
        suggestions.push('Amount Lost');
      }
    }
    
    return suggestions;
  }
}
