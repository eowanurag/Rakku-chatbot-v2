import { Injectable, Optional, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SreTelemetry {
  private readonly logger = new Logger('SreTelemetry');

  constructor(@Optional() private readonly eventEmitter?: EventEmitter2) {}

  public emit(event: string, payload: Record<string, any>) {
    // Sanitize any potential PII or narrative logs before emission
    const sanitizedPayload: Record<string, any> = {};
    const piiKeys = new Set(['narrative', 'text', 'phone', 'mobile', 'email', 'name', 'aadhaar', 'upi', 'address']);

    for (const key of Object.keys(payload)) {
      if (!piiKeys.has(key.toLowerCase())) {
        sanitizedPayload[key] = payload[key];
      }
    }

    if (this.eventEmitter) {
      this.eventEmitter.emit(event, sanitizedPayload);
    }

    this.logger.log(`[SRE_EVENT] event=${event} payload=${JSON.stringify(sanitizedPayload)}`);
  }
}
