import { AiCircuitBreaker } from '../../backend/src/chat/services/ai-circuit-breaker';
import { CircuitBreakerStatus } from '../../backend/src/copilot/cie/dto/understanding-result.dto';

describe('Resilience - Circuit Breaker', () => {
  let circuitBreaker: AiCircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new AiCircuitBreaker();
  });

  it('should start in CLOSED state and transition to OPEN after 5 consecutive failures', () => {
    expect(circuitBreaker.getStatus()).toBe(CircuitBreakerStatus.CLOSED);
    expect(circuitBreaker.isOpen()).toBe(false);

    // Record 4 failures
    for (let i = 0; i < 4; i++) {
      circuitBreaker.recordFailure(new Error('Connection failed'));
      expect(circuitBreaker.getStatus()).toBe(CircuitBreakerStatus.CLOSED);
    }

    // 5th failure trips it
    circuitBreaker.recordFailure(new Error('Connection failed'));
    expect(circuitBreaker.getStatus()).toBe(CircuitBreakerStatus.OPEN);
    expect(circuitBreaker.isOpen()).toBe(true);
  });

  it('should reset consecutive failures on success', () => {
    for (let i = 0; i < 4; i++) {
      circuitBreaker.recordFailure(new Error('Connection failed'));
    }
    circuitBreaker.recordSuccess();

    // 5th failure should not trip it now since count reset
    circuitBreaker.recordFailure(new Error('Connection failed'));
    expect(circuitBreaker.getStatus()).toBe(CircuitBreakerStatus.CLOSED);
  });

  it('should move to HALF_OPEN after cooldown time expires', () => {
    // Trip it
    for (let i = 0; i < 5; i++) {
      circuitBreaker.recordFailure(new Error('Connection failed'));
    }
    expect(circuitBreaker.getStatus()).toBe(CircuitBreakerStatus.OPEN);

    // Mock time forward
    const lastFailureTime = (circuitBreaker as any).lastFailureTime;
    (circuitBreaker as any).lastFailureTime = lastFailureTime - 301000; // 5 mins + 1 sec

    expect(circuitBreaker.getStatus()).toBe(CircuitBreakerStatus.HALF_OPEN);
  });
});
