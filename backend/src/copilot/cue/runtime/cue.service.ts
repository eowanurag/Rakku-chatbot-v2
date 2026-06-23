import { Injectable, Inject, Optional } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma.service';
import { UnderstandingProvider } from './providers/understanding-provider.interface';
import { CueResult } from '../interfaces/cue-result.interface';
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
    
    // Multi-turn context analysis
    const chatHistory = await this.prisma.chatHistory.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' }
    });

    const previousUserMessages = chatHistory.filter(h => h.role === 'user').map(h => h.message);
    const lowerNarrative = narrative.toLowerCase();

    // 1. Single incident detection
    let singleIncident = true;
    const continuationWords = ['happened', 'it', 'was', 'yesterday', 'lost', 'also', 'too', 'near', 'by'];
    if (previousUserMessages.length > 0) {
      const isContinuation = continuationWords.some(w => lowerNarrative.includes(w)) || narrative.split(/\s+/).length < 5;
      singleIncident = isContinuation;
    }

    // 2. Intent switching detection
    let intentSwitched = false;
    if (previousUserMessages.length > 0) {
      const wasFilingComplaint = previousUserMessages.some(m => m.toLowerCase().includes('complaint') || m.toLowerCase().includes('stolen') || m.toLowerCase().includes('chori'));
      const askingForStation = lowerNarrative.includes('nearest') || lowerNarrative.includes('station') || lowerNarrative.includes('where is');
      if (wasFilingComplaint && askingForStation) {
        intentSwitched = true;
      }
    }

    // 3. Entity persistence
    const persistedEntities: Record<string, string[]> = {
      locations: [],
      dates: [],
      persons: [],
      vehicles: [],
      devices: [],
      documents: []
    };

    const extractPatterns = (text: string) => {
      const lower = text.toLowerCase();
      const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g;
      const dates = text.match(dateRegex) || [];
      
      const imeiRegex = /\b\d{15}\b/g;
      const devices = text.match(imeiRegex) || [];

      const plateRegex = /\b[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}\b/ig;
      const vehicles = text.match(plateRegex) || [];

      const locations: string[] = [];
      const locKeywords = ['lucknow', 'meerut', 'ayodhya', 'noida', 'ghaziabad', 'civil lines'];
      locKeywords.forEach(k => {
        if (lower.includes(k)) locations.push(k);
      });

      return { dates, devices, vehicles, locations };
    };

    const allNarratives = [...previousUserMessages, narrative];
    for (const textTurn of allNarratives) {
      const parsed = extractPatterns(textTurn);
      persistedEntities.locations.push(...parsed.locations);
      persistedEntities.dates.push(...parsed.dates);
      persistedEntities.vehicles.push(...parsed.vehicles);
      persistedEntities.devices.push(...parsed.devices);
    }

    Object.keys(persistedEntities).forEach(key => {
      persistedEntities[key] = Array.from(new Set(persistedEntities[key]));
    });

    cueResult.singleIncident = singleIncident;
    cueResult.intentSwitched = intentSwitched;
    cueResult.persistedEntities = persistedEntities;

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
      unknownTermCount: cueResult.unknownTerms ? cueResult.unknownTerms.length : 0,
      singleIncident,
      intentSwitched,
      persistedEntities
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
