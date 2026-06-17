export interface ScenarioHintResult {
  confidence: number;
  scenarioHints: string[];
  hintSource: string[];
  entities: {
    type: string;
    value: string;
  }[];
  legacyIntent?: string;
}
