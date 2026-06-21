export enum AiDependencyType {
  ENHANCEMENT = 'ENHANCEMENT',
  OPTIONAL = 'OPTIONAL'
}

export enum AiCapabilityLevel {
  NONE = 'NONE',
  ASSISTED = 'ASSISTED',
  ENHANCED = 'ENHANCED'
}

export interface FallbackMode {
  activated: boolean;
  provider: 'REGEX' | 'RULE' | 'DICTIONARY';
  confidence: number;
}

export interface AiDependencyOptions {
  type: AiDependencyType;
  description?: string;
}
