import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs';
import * as path from 'path';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

interface CircuitPersistedState {
  version: number;
  state: CircuitState;
  openedAt?: string;
  failures: number;
}

@Injectable()
export class AiCircuitBreakerService {
  private readonly logger = new Logger(AiCircuitBreakerService.name);
  private readonly storagePath = path.resolve(process.cwd(), 'storage/ai-circuit-state.json');

  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private openedAt?: Date;

  private failureThreshold = 5;
  private cooldownMinutes = 5;

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.loadState();
  }

  public configure(failureThreshold: number, cooldownMinutes: number) {
    this.failureThreshold = failureThreshold;
    this.cooldownMinutes = cooldownMinutes;
    this.logger.log(`Circuit Breaker Configured: threshold=${failureThreshold}, cooldown=${cooldownMinutes}m`);
  }

  public getState(): CircuitState {
    this.checkCooldown();
    return this.state;
  }

  public recordSuccess() {
    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.CLOSED);
    }
    this.failures = 0;
    this.saveState();
  }

  public recordFailure() {
    this.failures++;
    this.logger.warn(`AI invocation failure recorded. Consecutive failure count: ${this.failures}`);
    
    if (this.state === CircuitState.CLOSED && this.failures >= this.failureThreshold) {
      this.openedAt = new Date();
      this.transitionTo(CircuitState.OPEN);
    } else if (this.state === CircuitState.HALF_OPEN) {
      this.openedAt = new Date();
      this.transitionTo(CircuitState.OPEN);
    }
    
    this.saveState();
  }

  private checkCooldown() {
    if (this.state === CircuitState.OPEN && this.openedAt) {
      const now = new Date();
      const elapsedMs = now.getTime() - this.openedAt.getTime();
      const cooldownMs = this.cooldownMinutes * 60 * 1000;
      
      if (elapsedMs >= cooldownMs) {
        this.transitionTo(CircuitState.HALF_OPEN);
        this.saveState();
      }
    }
  }

  private transitionTo(newState: CircuitState) {
    const oldState = this.state;
    this.state = newState;
    this.logger.log(`Circuit Breaker State Transition: ${oldState} -> ${newState}`);
    
    // Emit dynamic events
    this.eventEmitter.emit(`AI_CIRCUIT_${newState}`, {
      oldState,
      newState,
      timestamp: new Date()
    });
  }

  private loadState() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const data = fs.readFileSync(this.storagePath, 'utf8');
        const parsed: CircuitPersistedState = JSON.parse(data);
        
        if (parsed.version === 1 && Object.values(CircuitState).includes(parsed.state)) {
          this.state = parsed.state;
          this.failures = parsed.failures || 0;
          this.openedAt = parsed.openedAt ? new Date(parsed.openedAt) : undefined;
          this.logger.log(`Loaded persisted Circuit Breaker state: ${this.state}`);
          return;
        }
      }
    } catch (err: any) {
      this.logger.warn(`Failed to parse circuit state persistence file (${err.message}). Resetting to CLOSED.`);
    }
    
    this.resetToClosed();
  }

  private resetToClosed() {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.openedAt = undefined;
    this.saveState();
  }

  private saveState() {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const stateData: CircuitPersistedState = {
        version: 1,
        state: this.state,
        openedAt: this.openedAt?.toISOString(),
        failures: this.failures
      };
      
      fs.writeFileSync(this.storagePath, JSON.stringify(stateData, null, 2), 'utf8');
    } catch (err: any) {
      this.logger.error(`Failed to write circuit state persistence cache: ${err.message}`);
    }
  }
}
