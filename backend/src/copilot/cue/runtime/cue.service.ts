import { Injectable, Inject, Optional } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma.service';
import { UnderstandingProvider } from './providers/understanding-provider.interface';
import { CueResult } from '../../interfaces/cue-result.interface';
import { CueEventsEmitter } from '../telemetry/cue-events';

@Injectable()
export class CueService {
  private eventsEmitter: CueEventsEmitter;

  constructor(
    @Inject('UnderstandingProvider')
    private readonly provider: UnderstandingProvider,
    private readonly prisma: PrismaService,
    @Optional() private readonly eventEmitter?: EventEmitter2
  ) {
    this.eventsEmitter = new CueEventsEmitter(eventEmitter);
  }

  public async normalize(narrative: string, sessionId = "default", relatedIntent?: string): Promise<{
    cueResult: CueResult;
    cueMetadata: any;
  }> {
    const cueResult = await this.provider.understand(narrative, sessionId);
    
    // Process unknown terms
    if (cueResult.unknownTerms && cueResult.unknownTerms.length > 0) {
      await this.handleUnknownTerms(cueResult.unknownTerms, narrative, relatedIntent, sessionId).catch(() => {
        // Ignore background write errors to keep runtime resilient
      });
    }

    // Emit normalization telemetry
    this.eventsEmitter.emitNormalizationCompleted({
      sessionId,
      unknownTermsCount: cueResult.unknownTerms ? cueResult.unknownTerms.length : 0,
      transformationsCount: cueResult.transformationLog ? cueResult.transformationLog.length : 0,
      requiresAIReview: cueResult.requiresAIReview
    });

    const cueMetadata = {
      cueVersion: "1.0.0",
      dictionarySnapshot: {
        synonyms: cueResult.cueDictionaryVersions.synonyms,
        dialects: cueResult.cueDictionaryVersions.dialects,
        abbreviations: cueResult.cueDictionaryVersions.abbreviations,
        normalizationRules: cueResult.cueDictionaryVersions.normalizationRules
      },
      normalizationConfidence: cueResult.normalizationConfidence,
      understandingConfidence: cueResult.understandingConfidence,
      understandingBand: cueResult.understandingBand,
      unknownTermCount: cueResult.unknownTerms ? cueResult.unknownTerms.length : 0
    };

    return {
      cueResult,
      cueMetadata
    };
  }

  private async handleUnknownTerms(terms: string[], sampleNarrative: string, relatedIntent?: string, sessionId = "default") {
    for (const term of terms) {
      // Priority determination
      let priority = "LOW";
      const termLower = term.toLowerCase();
      if (termLower.includes("cyber") || termLower.includes("stalking") || termLower.includes("fraud")) {
        priority = "HIGH";
      } else if (termLower.includes("imei") || termLower.includes("upi") || termLower.includes("mac")) {
        priority = "MEDIUM";
      }

      // Check duplicate candidate in database
      const existing = await this.prisma.understandingCandidate.findFirst({
        where: { term: termLower }
      });

      let candidateId: string;
      if (existing) {
        const updated = await this.prisma.understandingCandidate.update({
          where: { id: existing.id },
          data: {
            occurrences: existing.occurrences + 1,
            sampleNarrative: sampleNarrative.substring(0, 500)
          }
        });
        candidateId = updated.id;
      } else {
        const created = await this.prisma.understandingCandidate.create({
          data: {
            term: termLower,
            occurrences: 1,
            sampleNarrative: sampleNarrative.substring(0, 500),
            status: "PENDING",
            priority,
            relatedIntent: relatedIntent || null
          }
        });
        candidateId = created.id;
      }

      // Ensure review queue entry
      const existingQueue = await this.prisma.understandingReviewQueue.findFirst({
        where: { candidateId }
      });

      if (!existingQueue) {
        await this.prisma.understandingReviewQueue.create({
          data: {
            candidateId,
            reviewType: "HUMAN_OR_AI",
            status: "PENDING"
          }
        });
      }

      // Emit event
      this.eventsEmitter.emitUnknownTermDetected({
        sessionId,
        term: termLower,
        sampleNarrativeSanitized: "[REDACTED]"
      });
    }
  }
}
