import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export enum AbandonmentRisk {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

@Injectable()
export class WorkflowCompletionService {
  constructor(private readonly prisma: PrismaService) {}

  calculateCompletion(workflow: string | null, data: Record<string, any>): number {
    if (!workflow) return 0;
    
    // Define required keys per workflow
    let requiredKeys: string[] = [];
    switch (workflow) {
      case 'complaint':
        requiredKeys = ['type', 'location', 'time', 'details', 'contact'];
        // Check also nested applicationData or state data
        break;
      case 'verification':
        requiredKeys = ['verificationType', 'name', 'address', 'mobile', 'propertyDetails'];
        break;
      case 'certificate':
        requiredKeys = ['name', 'address', 'district', 'purpose'];
        break;
      case 'event':
        requiredKeys = ['eventType', 'eventName', 'location', 'date', 'expectedAttendance'];
        break;
      default:
        return 0;
    }

    if (requiredKeys.length === 0) return 0;

    let filledCount = 0;
    requiredKeys.forEach(key => {
      const val = data[key];
      if (val !== undefined && val !== null && val !== '') {
        filledCount++;
      }
    });

    return Math.round((filledCount / requiredKeys.length) * 100);
  }

  evaluateAbandonmentRisk(signals: {
    inactivityMinutes: number;
    backActionsCount: number;
    validationFailuresCount: number;
    modificationsCount: number;
    offlineDisconnects: number;
  }): AbandonmentRisk {
    let score = 0;

    // Signal 1: Inactivity
    if (signals.inactivityMinutes >= 5) {
      score += 3;
    } else if (signals.inactivityMinutes >= 2) {
      score += 1;
    }

    // Signal 2: Multiple back actions
    if (signals.backActionsCount >= 3) {
      score += 2;
    } else if (signals.backActionsCount >= 1) {
      score += 1;
    }

    // Signal 3: Repeated validation failures
    if (signals.validationFailuresCount >= 3) {
      score += 3;
    } else if (signals.validationFailuresCount >= 1) {
      score += 1;
    }

    // Signal 4: Repeated modifications
    if (signals.modificationsCount >= 4) {
      score += 2;
    } else if (signals.modificationsCount >= 2) {
      score += 1;
    }

    // Signal 5: Offline disconnects
    if (signals.offlineDisconnects >= 2) {
      score += 2;
    } else if (signals.offlineDisconnects >= 1) {
      score += 1;
    }

    if (score >= 7) return AbandonmentRisk.CRITICAL;
    if (score >= 4) return AbandonmentRisk.HIGH;
    if (score >= 2) return AbandonmentRisk.MEDIUM;
    return AbandonmentRisk.LOW;
  }

  async persistMetrics(params: {
    sessionId: string;
    workflowType: string;
    completionPercentage: number;
    abandonmentRisk: string;
    completed: boolean;
  }): Promise<void> {
    try {
      await this.prisma.workflowCompletionMetrics.create({
        data: {
          sessionId: params.sessionId,
          workflowType: params.workflowType,
          completionPercentage: params.completionPercentage,
          abandonmentRisk: params.abandonmentRisk,
          completed: params.completed,
        }
      });
    } catch (err) {
      console.error(`[WorkflowCompletionService] Failed to persist metrics: ${err.message}`);
    }
  }

  async logWorkflowEvent(params: {
    sessionId: string;
    workflowType: string;
    eventType: string;
  }): Promise<void> {
    try {
      await this.prisma.citizenWorkflowEvent.create({
        data: {
          sessionId: params.sessionId,
          workflowType: params.workflowType,
          eventType: params.eventType,
        }
      });
    } catch (err) {
      console.error(`[WorkflowCompletionService] Failed to log workflow event: ${err.message}`);
    }
  }
}
