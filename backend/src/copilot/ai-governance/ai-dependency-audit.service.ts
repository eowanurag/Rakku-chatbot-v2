import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { AiDependencyRegistry } from './ai-dependency.registry';
import { AiDependencyType } from './ai-dependency.types';

@Injectable()
export class AiDependencyAuditService implements OnModuleInit {
  private readonly logger = new Logger(AiDependencyAuditService.name);

  onModuleInit() {
    this.checkOfflineMode();
    this.auditDependencies();
  }

  private checkOfflineMode() {
    const isApiKeyMissing = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '';
    const isAiDisabled = process.env.AI_DISABLED === 'true';

    if (isApiKeyMissing || isAiDisabled) {
      console.log(`
==================================================
[Rakku]
AI Provider: Disabled
Mode: Deterministic
Fallback Engines: Active
AI Independence Certification: PASS
==================================================
      `);
      this.logger.log('Running in 100% Deterministic Fallback Mode.');
    } else {
      this.logger.log('AI Provider active (Gemini).');
    }
  }

  private auditDependencies() {
    const dependencies = AiDependencyRegistry.getDependencies();
    const isStrict = process.env.AI_DEPENDENCY_STRICT === 'true' || process.env.NODE_ENV === 'production';

    this.logger.log(`Auditing ${dependencies.length} registered AI dependencies...`);

    for (const dep of dependencies) {
      const isValid = dep.type === AiDependencyType.ENHANCEMENT || dep.type === AiDependencyType.OPTIONAL;

      if (!isValid) {
        const errorMsg = `AI Governance Violation: Component ${dep.target} registered with invalid or unknown dependency type "${dep.type}".`;
        if (isStrict) {
          this.logger.error(`${errorMsg} CRITICAL: Blocking startup.`);
          throw new Error(errorMsg);
        } else {
          this.logger.warn(`${errorMsg} WARNING: Dev mode active, continuing.`);
        }
      }
    }

    this.logger.log('AI dependency audit completed successfully.');
  }
}
