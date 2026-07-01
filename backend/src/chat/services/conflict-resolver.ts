import { Injectable, Logger } from '@nestjs/common';
import { UnderstandingResult } from '../../copilot/cie/dto/understanding-result.dto';

@Injectable()
export class ConflictResolver {
  private readonly logger = new Logger(ConflictResolver.name);

  /**
   * Resolves conflicts between the rule-based understanding and the AI enhancement.
   * Modifies the aiResult in place or returns a cleaned aiResult to prevent merging conflicts.
   */
  public resolveConflicts(
    ruleResult: UnderstandingResult,
    aiResult: UnderstandingResult
  ): UnderstandingResult {
    const resolvedAiResult = { ...aiResult };

    // 1. Conflict: complaintType
    if (ruleResult.complaintType && ruleResult.confidence === 'HIGH') {
      if (aiResult.complaintType && aiResult.complaintType !== ruleResult.complaintType) {
        this.logger.warn(
          `[CONFLICT_RESOLVED] Conflict detected in complaintType: Rule='${ruleResult.complaintType}' vs AI='${aiResult.complaintType}'. Resolving to Rule.`
        );
        resolvedAiResult.complaintType = ruleResult.complaintType;
        resolvedAiResult.intent = ruleResult.intent;
      }
    }

    // 2. Conflict: containers
    if (ruleResult.containers && ruleResult.containers.length > 0 && ruleResult.confidence === 'HIGH') {
      const ruleContainerTypes = ruleResult.containers.map(c => c.type);
      const conflictingAiContainers = resolvedAiResult.containers.filter(
        aiC => !ruleContainerTypes.includes(aiC.type)
      );

      if (conflictingAiContainers.length > 0) {
        this.logger.warn(
          `[CONFLICT_RESOLVED] AI suggested conflicting containers: [${conflictingAiContainers.map(c => c.type).join(', ')}]. Overriding with Rule containers.`
        );
        // Overwrite AI containers with the Rule containers to prevent contamination during merger
        resolvedAiResult.containers = [...ruleResult.containers];
      }
    }

    // 3. Conflict: language
    if (ruleResult.language && ruleResult.confidence === 'HIGH') {
      if (resolvedAiResult.language !== ruleResult.language) {
        this.logger.warn(
          `[CONFLICT_RESOLVED] Language mismatch: Rule='${ruleResult.language}' vs AI='${resolvedAiResult.language}'. Resolving to Rule.`
        );
        resolvedAiResult.language = ruleResult.language;
      }
    }

    return resolvedAiResult;
  }
}
