import { Injectable } from '@nestjs/common';

export interface ProgressResult {
  completionPercentage: number;
  remainingSteps: number;
  estimatedTimeText: string;
  estimatedTimeSeconds: number;
}

@Injectable()
export class ProgressService {
  public calculateProgress(workflow: string, currentStep: string): ProgressResult {
    const wfUpper = (workflow || '').toUpperCase().replace(/\s+/g, '_');
    const stepLower = (currentStep || '').toLowerCase();

    let steps: string[] = ['start', 'review'];
    if (wfUpper.includes('LOST_MOBILE')) {
      steps = ['start', 'brand', 'model', 'imei', 'location', 'details', 'review'];
    } else if (wfUpper.includes('CYBER_FRAUD')) {
      steps = ['start', 'transaction', 'bank', 'amount', 'details', 'review'];
    } else if (wfUpper.includes('TENANT') || wfUpper.includes('TENANT_VERIFICATION')) {
      steps = ['start', 'tenant_name', 'address', 'mobile', 'property', 'review'];
    }

    const currentIndex = steps.findIndex(s => stepLower.includes(s));
    const activeIndex = currentIndex !== -1 ? currentIndex : 0;
    const remainingSteps = Math.max(0, steps.length - 1 - activeIndex);
    const completionPercentage = Math.min(100, Math.round((activeIndex / (steps.length - 1 || 1)) * 100));

    // Heuristic: 30 seconds per remaining step
    const timeSec = remainingSteps * 30;
    const minutes = Math.floor(timeSec / 60);
    const seconds = timeSec % 60;
    
    let timeText = '0 seconds';
    if (minutes > 0) {
      timeText = `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (seconds > 0) {
      timeText = `${seconds} seconds`;
    }

    return {
      completionPercentage,
      remainingSteps,
      estimatedTimeText: timeText,
      estimatedTimeSeconds: timeSec
    };
  }

  public getPrompt(workflow: string, currentStep: string): string {
    const progress = this.calculateProgress(workflow, currentStep);
    return `You have completed ${progress.completionPercentage}% of this complaint.\n\nOnly ${progress.remainingSteps} steps remain.`;
  }
}
