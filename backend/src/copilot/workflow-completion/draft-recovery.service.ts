import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class DraftRecoveryService {
  constructor(private readonly prisma: PrismaService) {}

  async detectAbandonment(sessionId: string): Promise<boolean> {
    const session = await this.prisma.workflowSession.findUnique({
      where: { id: sessionId }
    });
    if (!session || session.isCompleted) return false;

    const now = new Date();
    const lastUpdate = new Date(session.updatedAt);
    const diffMins = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    return diffMins >= 5;
  }

  async recoverDraft(sessionId: string): Promise<any | null> {
    const session = await this.prisma.workflowSession.findUnique({
      where: { id: sessionId }
    });
    if (!session) return null;

    const state = typeof session.stateJson === 'string'
      ? JSON.parse(session.stateJson)
      : (session.stateJson as any);

    if (state && state.resumeInformation) {
      // Log CitizenWorkflowEvent (resumed)
      await this.prisma.citizenWorkflowEvent.create({
        data: {
          sessionId,
          workflowType: state.resumeInformation.workflowId,
          eventType: 'WORKFLOW_RESUMED'
        }
      });

      return state.resumeInformation;
    }

    return null;
  }

  public getIntelligentResumeMessage(workflow: string, lastCompletedSection: string): string {
    const wfName = (workflow || '').toLowerCase().includes('lost_mobile') || (workflow || '').toLowerCase() === 'complaint'
      ? 'Lost Mobile'
      : (workflow || '').toLowerCase().includes('cyber')
      ? 'Cyber Fraud'
      : (workflow || '').toLowerCase().includes('missing')
      ? 'Missing Person'
      : 'Complaint';

    // Heuristics: remaining time is estimated based on completed step name
    let estTime = '1 minute';
    if ((lastCompletedSection || '').toLowerCase().includes('brand') || (lastCompletedSection || '').toLowerCase().includes('date')) {
      estTime = '1 minute';
    }

    return `You were filing a ${wfName} complaint.\n\nLast completed section:\n${lastCompletedSection || 'Incident Date'}\n\nEstimated remaining time:\n${estTime}.\n\nWould you like to continue?`;
  }
}
