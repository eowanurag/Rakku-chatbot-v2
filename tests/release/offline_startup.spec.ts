import { AiDependencyAuditService } from '../../backend/src/copilot/ai-governance/ai-dependency-audit.service';
import { AiDependencyRegistry } from '../../backend/src/copilot/ai-governance/ai-dependency.registry';
import { AiDependencyType } from '../../backend/src/copilot/ai-governance/ai-dependency.types';

describe('Offline Mode Startup Certification Suite', () => {
  let auditService: AiDependencyAuditService;
  const originalApiKey = process.env.GEMINI_API_KEY;
  const originalDisabled = process.env.AI_DISABLED;
  const originalStrict = process.env.AI_DEPENDENCY_STRICT;

  beforeEach(() => {
    auditService = new AiDependencyAuditService();
    AiDependencyRegistry.clear();
  });

  afterAll(() => {
    process.env.GEMINI_API_KEY = originalApiKey;
    process.env.AI_DISABLED = originalDisabled;
    process.env.AI_DEPENDENCY_STRICT = originalStrict;
  });

  it('should initialize and execute audit successfully when Gemini API Key is disabled/empty', () => {
    process.env.GEMINI_API_KEY = '';
    process.env.AI_DISABLED = 'true';
    process.env.AI_DEPENDENCY_STRICT = 'true';

    // Register valid enhancement dependencies
    AiDependencyRegistry.register('AiClassifier', { type: AiDependencyType.ENHANCEMENT });
    AiDependencyRegistry.register('FactExtractor', { type: AiDependencyType.OPTIONAL });

    expect(() => auditService.onModuleInit()).not.toThrow();
  });

  it('should throw startup exception in strict mode if an unregistered/invalid dependency classification is discovered', () => {
    process.env.GEMINI_API_KEY = '';
    process.env.AI_DISABLED = 'true';
    process.env.AI_DEPENDENCY_STRICT = 'true';

    // Register invalid dependency type (simulating REQUIRED or malformed input)
    AiDependencyRegistry.register('CriticalAiService', { type: 'INVALID_TYPE' as any });

    expect(() => auditService.onModuleInit()).toThrow(/AI Governance Violation/);
  });

  it('should only warn (not throw) in non-strict mode when invalid dependency is present', () => {
    process.env.GEMINI_API_KEY = '';
    process.env.AI_DISABLED = 'true';
    process.env.AI_DEPENDENCY_STRICT = 'false';

    AiDependencyRegistry.register('CriticalAiService', { type: 'INVALID_TYPE' as any });

    expect(() => auditService.onModuleInit()).not.toThrow();
  });
});
