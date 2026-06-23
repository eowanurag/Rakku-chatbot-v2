import { Injectable } from '@nestjs/common';

export interface FrictionResult {
  frictionScore: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
}

@Injectable()
export class WorkflowFrictionService {
  public calculateFriction(state: {
    modificationsCount?: number;
    backActionsCount?: number;
    validationFailuresCount?: number;
    lastActivityAt?: string | Date;
  }): FrictionResult {
    const reasons: string[] = [];
    let frictionScore = 0;

    const modifications = state.modificationsCount || 0;
    const backActions = state.backActionsCount || 0;
    const validationFailures = state.validationFailuresCount || 0;

    if (modifications > 2) {
      frictionScore += 30;
      reasons.push(`Repeated edits detected (${modifications} modifications).`);
    }
    if (backActions > 2) {
      frictionScore += 25;
      reasons.push(`Repeated clarifications or step backs detected (${backActions} back actions).`);
    }
    if (validationFailures > 2) {
      frictionScore += 25;
      reasons.push(`Question retries or validation failures detected (${validationFailures} failures).`);
    }

    if (state.lastActivityAt) {
      const lastAct = new Date(state.lastActivityAt);
      const idleMs = Date.now() - lastAct.getTime();
      const idleMins = idleMs / (1000 * 60);
      if (idleMins > 15) {
        frictionScore += 20;
        reasons.push(`Idle session detected (inactive for ${Math.round(idleMins)} minutes).`);
      }
    }

    const finalScore = Math.min(100, frictionScore);
    let risk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (finalScore >= 60) {
      risk = 'HIGH';
    } else if (finalScore >= 30) {
      risk = 'MEDIUM';
    }

    return {
      frictionScore: finalScore,
      risk,
      reasons: reasons.length > 0 ? reasons : ['No significant friction detected.']
    };
  }
}
