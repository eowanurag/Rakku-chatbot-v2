import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { RuleUnderstandingEngine, getAiEnhancementFlags, needsAiEnhancement } from './rule-understanding-engine';
import { AiCircuitBreaker } from './ai-circuit-breaker';
import { UnderstandingMerger } from './understanding-merger';
import { ConflictResolver } from './conflict-resolver';
import { UnderstandingResult, CircuitBreakerStatus } from '../../copilot/cie/dto/understanding-result.dto';

@Injectable()
export class UnderstandingPipelineService {
  private readonly logger = new Logger(UnderstandingPipelineService.name);
  private readonly aiServiceUrl: string;
  private readonly conflictResolver = new ConflictResolver();

  constructor(
    private readonly ruleEngine: RuleUnderstandingEngine,
    private readonly circuitBreaker: AiCircuitBreaker,
    private readonly merger: UnderstandingMerger,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
  }

  public async process(
    message: string,
    sessionId: string,
    state: any,
    latitude?: number,
    longitude?: number
  ): Promise<UnderstandingResult> {
    const startTime = Date.now();
    this.logger.log(`[RULE_ENGINE_STARTED] Processing message for session ${sessionId}`);
    
    // 1. Run Rule Understanding Engine
    const existingItems = state.data?.incidentItems || [];
    const existingContainers = state.data?.containers || [];
    const ruleResult = await this.ruleEngine.understand(
      message, 
      state.language, 
      existingItems, 
      existingContainers
    );
    this.logger.log(`[RULE_ENGINE_COMPLETED] Rule engine finished with confidence: ${ruleResult.confidence}`);

    let finalResult = ruleResult;
    let aiAttempted = false;
    let aiSucceeded = false;
    let aiFailureReason: string | undefined;

    // 2. Check granular flags for AI enhancement and circuit breaker status
    const aiFlags = getAiEnhancementFlags(ruleResult);
    const aiNeeded = aiFlags.needsComplaintType || aiFlags.needsEntities || aiFlags.needsIncidentItems;
    const cbOpen = this.circuitBreaker.isOpen();

    if (!aiNeeded) {
      this.logger.log(`[AI_SKIPPED] Skipped AI: Rules have high confidence and no ambiguity`);
    } else if (cbOpen) {
      this.logger.log(`[AI_SKIPPED] Skipped AI: Circuit Breaker is ${this.circuitBreaker.getStatus()}`);
      aiFailureReason = 'Circuit Breaker Open';
    } else {
      // 3. Attempt AI Enhancement with retries
      aiAttempted = true;
      this.logger.log(
        `[AI_REQUEST_STARTED] Requesting AI enhancement from ${this.aiServiceUrl}/chat/message (Granular: Complaint=${aiFlags.needsComplaintType}, Entities=${aiFlags.needsEntities}, Items=${aiFlags.needsIncidentItems})`
      );

      const maxAttempts = 3;
      let lastError: any = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const responsePromise = firstValueFrom(
            this.httpService.post(`${this.aiServiceUrl}/chat/message`, {
              message,
              session_id: sessionId,
              latitude: latitude ?? state.citizen?.latitude,
              longitude: longitude ?? state.citizen?.longitude,
              state,
              aiFlags // Pass granular flags for cost optimization in FastAPI backend if supported
            }, { timeout: 8000 })
          );
          
          const response = await responsePromise;
          this.logger.log(`[AI_REQUEST_COMPLETED] AI response received successfully on attempt ${attempt}`);
          this.circuitBreaker.recordSuccess();

          const aiState = response.data?.state;
          if (aiState) {
            // Construct aiResult from updated state returned by FastAPI
            const aiResult: UnderstandingResult = {
              version: 1,
              language: aiState.language || ruleResult.language,
              intent: aiState.workflow || 'UNKNOWN',
              complaintType: aiState.data?.type || aiState.pendingComplaintType,
              entities: Object.entries(aiState.intelligence?.entities || {}).map(([key, val]) => ({
                name: key,
                value: val,
                confidence: 'HIGH',
                origin: 'AI'
              })),
              incidentItems: aiState.data?.incidentItems || [],
              containers: aiState.data?.containers || [],
              confidence: aiState.intelligence?.confidence || 'MEDIUM',
              ambiguity: aiState.intelligence?.clarificationRequired || false,
              source: 'RULE_PLUS_AI',
              response: response.data?.response,
              suggestions: response.data?.suggestions,
              avatar_state: response.data?.avatar_state
            };

            // 4. Resolve conflicts prior to merger
            const resolvedAiResult = this.conflictResolver.resolveConflicts(ruleResult, aiResult);

            // 5. Merge results conservatively
            finalResult = this.merger.mergeUnderstanding(ruleResult, resolvedAiResult);
            
            // Propagate AI response values back to finalResult
            finalResult.response = resolvedAiResult.response;
            finalResult.suggestions = resolvedAiResult.suggestions;
            finalResult.avatar_state = resolvedAiResult.avatar_state;
            
            aiSucceeded = true;
            this.logger.log(`[UNDERSTANDING_MERGED] Successfully resolved conflicts and merged Rule and AI understanding`);
          }
          break; // Succeeded, break retry loop
        } catch (e: any) {
          lastError = e;
          this.logger.warn(`[AI_ATTEMPT_FAILED] AI enhancement attempt ${attempt} failed: ${e?.message || e}`);
        }
      }

      if (!aiSucceeded && lastError) {
        aiFailureReason = lastError?.message || String(lastError);
        this.logger.warn(`[AI_FAILED] AI enhancement completely failed after ${maxAttempts} attempts.`);
        this.circuitBreaker.recordFailure(lastError);
      }
    }

    if (finalResult.source === 'MINIMUM_GUARANTEED') {
      this.logger.log(`[MINIMUM_GUARANTEED_USED] Fallback to minimum guaranteed understanding result used`);
    }

    // Attach extended metadata diagnostics
    const processingTimeMs = Date.now() - startTime;
    
    let pipelineType: 'RULE' | 'RULE_AI' | 'MERGED' = 'RULE';
    if (aiSucceeded) {
      pipelineType = finalResult.source === 'MERGED' ? 'MERGED' : 'RULE_AI';
    }

    finalResult.metadata = {
      pipeline: pipelineType,
      processingTimeMs,
      aiAttempted,
      aiSucceeded,
      aiFailureReason,
      circuitState: this.circuitBreaker.getStatus()
    };

    this.logger.log(`[UNDERSTANDING_SOURCE] Session ${sessionId} resolved source as ${finalResult.source}`);
    return finalResult;
  }
}
