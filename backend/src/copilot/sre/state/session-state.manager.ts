import { ScenarioSession, ConfidenceRecord } from '../interfaces/scenario-assessment.interface';

export class SessionStateManager {
  
  decayConfidence(history: ConfidenceRecord[] | null, currentVersion: number): ConfidenceRecord[] {
    if (!history) return [];
    
    return history.map(h => ({
      ...h,
      active: h.version === currentVersion
    }));
  }

  updateAskedQuestions(session: ScenarioSession, newQuestionId: string, gain: number): ScenarioSession {
    const questions = session.askedQuestions || [];
    questions.push({ questionId: newQuestionId, informationGain: gain, answered: false });
    return {
      ...session,
      askedQuestions: questions,
      clarificationCount: session.clarificationCount + 1
    };
  }
}
