import { Injectable } from '@nestjs/common';
import { workflowTimelineConfig, WorkflowTimelineConfig } from '../config/workflow-timeline.config';

@Injectable()
export class TimelineGeneratorService {
  getTimeline(workflowType: string): WorkflowTimelineConfig | null {
    const key = workflowType.toLowerCase();
    return workflowTimelineConfig[key] || null;
  }

  generateTimelineDisplay(workflowType: string): string {
    const config = this.getTimeline(workflowType);
    if (!config) {
      return '';
    }

    let display = `### Expected Timeline for ${workflowType.toUpperCase()}\n`;
    let totalDays = 0;
    config.stages.forEach((stage, idx) => {
      totalDays += stage.durationDays;
      display += `${idx + 1}. **${stage.label}** (${stage.durationDays} days)\n   _${stage.description}_\n`;
    });
    display += `\n**Estimated Total Processing Time:** ~${totalDays} days.`;
    return display;
  }
}
