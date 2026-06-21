import { AiHealthStatus } from '../ai-monitoring/ai-health.types';

export interface AiProviderResult<T = unknown> {
  success: boolean;
  fallbackUsed: boolean;
  confidence?: number;
  data?: T;
  errorType?: string;
}

export interface AiProvider {
  classify(text: string): Promise<AiProviderResult>;
  extractFacts(text: string, incidentType: string): Promise<AiProviderResult>;
  healthCheck(): Promise<AiHealthStatus>;
}
