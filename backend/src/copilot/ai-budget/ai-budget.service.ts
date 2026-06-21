import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AiBudgetService {
  private readonly logger = new Logger(AiBudgetService.name);

  private dailyCalls = 0;
  private hourlyCalls = 0;
  private estimatedTokens = 0;
  private fallbackActivations = 0;

  // Limits for alert triggers
  private readonly dailyCallLimit = 1000;
  private readonly hourlyCallLimit = 100;
  private readonly tokenLimit = 1000000;

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.resetHourlyCounters();
    this.resetDailyCounters();
  }

  public trackCall(tokensUsedEstimate = 150) {
    this.dailyCalls++;
    this.hourlyCalls++;
    this.estimatedTokens += tokensUsedEstimate;

    this.checkThresholds();
  }

  public trackFallback() {
    this.fallbackActivations++;
    this.logger.log(`Tracked AI Fallback activation. Total activations: ${this.fallbackActivations}`);
  }

  public getMetrics() {
    return {
      dailyCalls: this.dailyCalls,
      hourlyCalls: this.hourlyCalls,
      estimatedTokens: this.estimatedTokens,
      fallbackActivations: this.fallbackActivations
    };
  }

  private checkThresholds() {
    if (this.hourlyCalls >= this.hourlyCallLimit) {
      this.logger.warn(`AI Budget Warning: Hourly call count (${this.hourlyCalls}) has exceeded limit (${this.hourlyCallLimit}).`);
      this.eventEmitter.emit('AI_BUDGET_EXCEEDED', { type: 'HOURLY', count: this.hourlyCalls });
    }

    if (this.dailyCalls >= this.dailyCallLimit) {
      this.logger.warn(`AI Budget Warning: Daily call count (${this.dailyCalls}) has exceeded limit (${this.dailyCallLimit}).`);
      this.eventEmitter.emit('AI_BUDGET_EXCEEDED', { type: 'DAILY', count: this.dailyCalls });
    }

    if (this.estimatedTokens >= this.tokenLimit) {
      this.logger.warn(`AI Budget Warning: Token estimation (${this.estimatedTokens}) has exceeded limit (${this.tokenLimit}).`);
      this.eventEmitter.emit('AI_BUDGET_EXCEEDED', { type: 'TOKENS', count: this.estimatedTokens });
    }
  }

  private resetHourlyCounters() {
    setInterval(() => {
      this.logger.log(`Resetting hourly AI budget calls from ${this.hourlyCalls} to 0`);
      this.hourlyCalls = 0;
    }, 60 * 60 * 1000);
  }

  private resetDailyCounters() {
    setInterval(() => {
      this.logger.log(`Resetting daily AI budget calls from ${this.dailyCalls} to 0`);
      this.dailyCalls = 0;
      this.estimatedTokens = 0;
    }, 24 * 60 * 60 * 1000);
  }
}
