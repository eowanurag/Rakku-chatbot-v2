import { ScenarioHintResult } from '../interfaces/scenario-hint-result.interface';

export interface HintProvider {
  generateHints(narrative: string): Promise<ScenarioHintResult>;
}
