import { Injectable } from '@nestjs/common';
import { fieldAssistanceConfig, FieldAssistanceTemplate } from '../config/field-assistance.config';

@Injectable()
export class FieldAssistanceService {
  public getSuggestions(complaintType: string): FieldAssistanceTemplate | null {
    if (!complaintType) return null;
    const typeUpper = complaintType.toUpperCase().replace(/\s+/g, '_');
    return fieldAssistanceConfig[typeUpper] || null;
  }

  public getFormattedHints(complaintType: string): string[] {
    const template = this.getSuggestions(complaintType);
    if (!template) return [];
    return template.suggestions.map(s => `${s.field}: ${s.description}`);
  }
}
