import { Injectable, Logger } from '@nestjs/common';
import { CircuitBreakerStatus } from '../../copilot/cie/dto/understanding-result.dto';

@Injectable()
export class AiCircuitBreaker {
  private readonly logger = new Logger(AiCircuitBreaker.name);
  private status: CircuitBreakerStatus = CircuitBreakerStatus.CLOSED;
  private consecutiveFailures = 0;
  private lastFailureTime = 0;
  private readonly tripThreshold = 5;
  private readonly cooldownMs = 300000; // 5 minutes

  public getStatus(): CircuitBreakerStatus {
    this.updateStatus();
    return this.status;
  }

  public recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.status = CircuitBreakerStatus.CLOSED;
  }

  public recordFailure(error: any): void {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();
    
    this.logger.warn(
      `AI Service failure recorded (${this.consecutiveFailures}/${this.tripThreshold}): ${error?.message || error}`
    );

    if (this.consecutiveFailures >= this.tripThreshold) {
      this.status = CircuitBreakerStatus.OPEN;
      this.logger.error(
        `AI Circuit Breaker tripped to OPEN. Bypassing AI calls for the next 5 minutes.`
      );
    }
  }

  public isOpen(): boolean {
    return this.getStatus() === CircuitBreakerStatus.OPEN;
  }

  private updateStatus(): void {
    if (this.status === CircuitBreakerStatus.OPEN) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure >= this.cooldownMs) {
        this.status = CircuitBreakerStatus.HALF_OPEN;
        this.logger.log(`AI Circuit Breaker moved to HALF_OPEN. Retrying AI requests.`);
      }
    }
  }
}
