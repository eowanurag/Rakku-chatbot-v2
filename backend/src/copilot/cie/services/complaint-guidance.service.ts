import { Injectable } from '@nestjs/common';
import { complaintGuidanceConfig, ComplaintGuidanceTemplate } from '../config/complaint-guidance.config';

@Injectable()
export class ComplaintGuidanceService {
  getTemplate(workflowType: string): ComplaintGuidanceTemplate | null {
    const key = workflowType.toUpperCase().replace(/\s+/g, '_');
    return complaintGuidanceConfig[key] || null;
  }

  generateGuidanceMessage(workflowType: string, missingFields: string[]): string {
    const template = this.getTemplate(workflowType);
    if (!template) {
      return 'Please complete the missing details to submit your complaint.';
    }

    let response = `To proceed with your **${template.workflowType.replace('_', ' ')}** complaint, we need a few details:\n`;
    missingFields.forEach(field => {
      const guidance = template.fields.find(f => f.key === field || f.key.toLowerCase() === field.toLowerCase());
      if (guidance) {
        response += `- **${guidance.label}**: ${guidance.description}`;
        if (guidance.tip) {
          response += ` *(Tip: ${guidance.tip})*`;
        }
        response += '\n';
      } else {
        response += `- **${field}**: Please provide details.\n`;
      }
    });

    if (template.criticalTips.length > 0) {
      response += '\n**Important Actions:**\n';
      template.criticalTips.forEach(tip => {
        response += `* ${tip}\n`;
      });
    }

    return response;
  }
}
