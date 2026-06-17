import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';

export const CUE_NORMALIZATION_COMPLETED = 'cue.normalization.completed';
export const UNKNOWN_TERM_DETECTED = 'cue.unknown_term.detected';

export class CueEventsEmitter {
  private readonly logger = new Logger('CueTelemetry');

  constructor(private readonly eventEmitter?: EventEmitter2) {}

  public emitNormalizationCompleted(payload: {
    sessionId: string;
    unknownTermsCount: number;
    transformationsCount: number;
    requiresAIReview: boolean;
  }) {
    const eventPayload = {
      sessionId: payload.sessionId,
      unknownTermsCount: payload.unknownTermsCount,
      transformationsCount: payload.transformationsCount,
      requiresAIReview: payload.requiresAIReview
    };

    if (this.eventEmitter) {
      this.eventEmitter.emit(CUE_NORMALIZATION_COMPLETED, eventPayload);
    }
    
    this.logger.log(`[CUE_NORMALIZATION_COMPLETED] sessionId=${payload.sessionId} unknownTermsCount=${payload.unknownTermsCount} transformationsCount=${payload.transformationsCount} requiresAIReview=${payload.requiresAIReview}`);
  }

  public emitUnknownTermDetected(payload: {
    sessionId: string;
    term: string;
    sampleNarrativeSanitized: string;
  }) {
    if (this.eventEmitter) {
      this.eventEmitter.emit(UNKNOWN_TERM_DETECTED, payload);
    }
    this.logger.warn(`[UNKNOWN_TERM_DETECTED] term=${payload.term}`);
  }
}
