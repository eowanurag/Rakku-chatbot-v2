import { Injectable } from '@nestjs/common';
import { questionAssistanceConfig, QuestionAssistanceItem } from './config/question-assistance.config';

@Injectable()
export class QuestionAssistanceService {
  public getAssistance(fieldName: string): QuestionAssistanceItem | null {
    if (!fieldName) return null;
    const normalizedKey = fieldName.toUpperCase().replace(/\s+/g, '_');
    return questionAssistanceConfig[normalizedKey] || null;
  }

  public getHelpText(fieldName: string): string {
    const assist = this.getAssistance(fieldName);
    if (!assist) return '';
    return `${assist.hint}\n${assist.example}`;
  }
}
