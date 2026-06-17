import { CueResult } from '../../interfaces/cue-result.interface';

export interface UnderstandingProvider {
  understand(narrative: string, sessionId?: string): Promise<CueResult>;
}
