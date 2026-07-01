import { IncidentItem, IncidentContainer } from '../services/incident-item.service';

export type UnderstandingSource = 'RULE_ONLY' | 'RULE_PLUS_AI' | 'MERGED' | 'MINIMUM_GUARANTEED';

export enum CircuitBreakerStatus {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface UnderstandingMetadata {
  pipeline: 'RULE' | 'RULE_AI' | 'MERGED';
  processingTimeMs: number;
  aiAttempted: boolean;
  aiSucceeded: boolean;
  aiFailureReason?: string;
  circuitState: CircuitBreakerStatus;
}

export interface Entity {
  name: string;
  value: any;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  origin: 'RULE' | 'AI';
}

export interface UnderstandingResult {
  version: number;
  language: 'en' | 'hi' | 'hinglish';
  intent: string;
  complaintType?: string;
  entities: Entity[];
  incidentItems: IncidentItem[];
  containers: IncidentContainer[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  ambiguity: boolean;
  source: UnderstandingSource;
  metadata?: UnderstandingMetadata;

  // Render properties returned from AI or rule system
  response?: string;
  suggestions?: string[];
  avatar_state?: string;
}

export type AiUnderstanding = UnderstandingResult;
