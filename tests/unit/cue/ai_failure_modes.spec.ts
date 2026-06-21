import { AiCircuitBreakerService, CircuitState } from '../../../backend/src/copilot/ai-resilience/ai-circuit-breaker.service';
import * as fs from 'fs';
import * as path from 'path';

describe('AI Resilience & Circuit Breaker Unit Tests', () => {
  let circuitBreaker: AiCircuitBreakerService;
  let mockEventEmitter: any;
  const storagePath = path.resolve(process.cwd(), 'storage/ai-circuit-state.json');

  beforeEach(() => {
    mockEventEmitter = {
      emit: jest.fn()
    };
    if (fs.existsSync(storagePath)) {
      fs.unlinkSync(storagePath);
    }
    circuitBreaker = new AiCircuitBreakerService(mockEventEmitter);
    circuitBreaker.configure(5, 5); // 5 failures, 5 minutes
  });

  afterEach(() => {
    if (fs.existsSync(storagePath)) {
      fs.unlinkSync(storagePath);
    }
  });

  it('should initially be in CLOSED state', () => {
    expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
  });

  it('should transition to OPEN after 5 consecutive failures', () => {
    for (let i = 0; i < 4; i++) {
      circuitBreaker.recordFailure();
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    }
    
    // 5th failure triggers transition
    circuitBreaker.recordFailure();
    expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('AI_CIRCUIT_OPEN', expect.any(Object));
  });

  it('should transition to HALF_OPEN after cooldown period elapses', () => {
    circuitBreaker.recordFailure();
    circuitBreaker.recordFailure();
    circuitBreaker.recordFailure();
    circuitBreaker.recordFailure();
    circuitBreaker.recordFailure();

    expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

    // Mock the openedAt date to be 6 minutes in the past (cooldown is 5 mins)
    const pastDate = new Date();
    pastDate.setMinutes(pastDate.getMinutes() - 6);
    (circuitBreaker as any).openedAt = pastDate;

    // Check status triggers HALF_OPEN
    expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('AI_CIRCUIT_HALF_OPEN', expect.any(Object));
  });

  it('should recover state correctly when loading corrupted persistence JSON files', () => {
    // Write invalid data to the storage path
    const dir = path.dirname(storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(storagePath, 'INVALID_CORRUPTED_JSON_DATA', 'utf8');

    // Instantiating a new breaker should trigger catch block and reset state to CLOSED
    const newBreaker = new AiCircuitBreakerService(mockEventEmitter);
    expect(newBreaker.getState()).toBe(CircuitState.CLOSED);
  });
});
