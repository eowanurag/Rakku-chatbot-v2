import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FactExtractor } from './engines/fact-extractor';
import { TimelineReconstructor } from './engines/timeline-reconstructor';
import { ContradictionDetector } from './engines/contradiction-detector';
import { GapAnalyzer } from './engines/gap-analyzer';
import { DraftGenerator } from './engines/draft-generator';
import { ComplaintAssessmentResult, IncidentModel, ReviewSections, NarrativeSnapshot, ComplaintSessionStatus } from './interfaces/complaint-intelligence.interface';

@Injectable()
export class ComplaintIntelligenceService {
  private readonly logger = new Logger(ComplaintIntelligenceService.name);
  private factExtractor: FactExtractor;
  private timelineReconstructor: TimelineReconstructor;
  private contradictionDetector: ContradictionDetector;
  private gapAnalyzer: GapAnalyzer;
  private draftGenerator: DraftGenerator;

  constructor(private readonly prisma: PrismaService) {
    this.factExtractor = new FactExtractor();
    this.timelineReconstructor = new TimelineReconstructor();
    this.contradictionDetector = new ContradictionDetector();
    this.gapAnalyzer = new GapAnalyzer();
    this.draftGenerator = new DraftGenerator();
  }

  public async assess(
    text: string,
    sessionId: string,
    incidentType: string,
    language: "en" | "hi" | "hinglish" = "en",
    changeSummary: string = "Narrative update"
  ): Promise<ComplaintAssessmentResult> {
    
    // Check ENABLE_CIE feature flag
    if (process.env.ENABLE_CIE === 'false') {
      try {
        await this.prisma.complaintSession.upsert({
          where: { sessionId },
          update: {
            incidentType,
            readinessScore: 1.0,
            status: "DRAFT_READY",
            clarificationRequired: false
          },
          create: {
            sessionId,
            incidentType,
            readinessScore: 1.0,
            status: "DRAFT_READY",
            clarificationRequired: false
          }
        });
      } catch (dbErr) {
        this.logger.warn(`Failed to persist CIE fallback status: ${dbErr.message}`);
      }

      return {
        incidentType,
        complaintReadinessScore: 1.0,
        firReadinessScore: 1.0,
        incidentModel: {
          incidentType,
          narrative: text,
          people: [],
          property: [],
          evidence: [],
          timelineEvents: [],
          completenessScore: 1.0,
        },
        extractedFacts: [],
        missingInformation: [],
        contradictions: [],
        draftText: `V1 Direct Submission Fallback for ${incidentType}: ${text}`,
        reviewSections: {
          applicantInfo: { note: "CIE Disabled. Direct submit bypass active." },
          incidentInfo: { type: incidentType, date: "N/A", location: "N/A" },
          timeline: [],
          property: [],
          evidence: []
        },
        narrativeSnapshots: []
      };
    }
    const { facts, model: extractedModel } = await this.factExtractor.extract(text, incidentType);

    // 2. Timeline Reconstruction
    const timeline = await this.timelineReconstructor.reconstruct(text);
    extractedModel.timelineEvents = timeline;

    // 3. Contradiction Detection
    const contradictions = this.contradictionDetector.detect(text, facts, timeline);

    // 4. Gap Analysis (calculates completeness, readiness, FIR readiness, and missing items)
    const {
      completenessScore,
      complaintReadinessScore,
      firReadinessScore,
      missingInformation
    } = this.gapAnalyzer.analyze(incidentType, facts, extractedModel);

    // Build finalized IncidentModel
    const incidentModel: IncidentModel = {
      incidentType,
      incidentDate: extractedModel.property?.[0]?.serialNumber || facts.find(f => f.field === 'incident_date')?.value || undefined,
      incidentLocation: facts.find(f => f.field === 'incident_location')?.value || undefined,
      narrative: text,
      people: extractedModel.people || [],
      property: extractedModel.property || [],
      evidence: extractedModel.evidence || [],
      timelineEvents: timeline,
      completenessScore
    };

    // 5. Draft Generation
    const draftText = this.draftGenerator.generate(incidentModel, language);

    // 6. Structured Review Section formatting (No HTML)
    const reviewSections: ReviewSections = {
      applicantInfo: {
        note: "Structured review details ready for client presentation"
      },
      incidentInfo: {
        type: incidentModel.incidentType,
        location: incidentModel.incidentLocation || "Unknown Location",
        date: incidentModel.incidentDate || "Unknown Date"
      },
      timeline: incidentModel.timelineEvents,
      property: incidentModel.property,
      evidence: incidentModel.evidence
    };

    // 7. Session Status Mapping
    let status: ComplaintSessionStatus = "COLLECTING";
    if (contradictions.length > 0 || missingInformation.length > 0) {
      status = "CLARIFYING";
    } else if (complaintReadinessScore >= 0.90) {
      status = "DRAFT_READY";
    }

    // 8. DB Persistence, Versioning Chain & Narrative Snapshots
    let factVersion = 1;
    let parentId: string | null = null;
    let snapshots: NarrativeSnapshot[] = [];

    try {
      const prevAssessment = await this.prisma.complaintAssessment.findFirst({
        where: { sessionId },
        orderBy: { createdAt: 'desc' }
      });

      if (prevAssessment) {
        factVersion = prevAssessment.factVersion + 1;
        parentId = prevAssessment.id;
        
        // Load existing snapshots history list
        if (prevAssessment.narrativeSnapshots) {
          snapshots = typeof prevAssessment.narrativeSnapshots === 'string'
            ? JSON.parse(prevAssessment.narrativeSnapshots)
            : prevAssessment.narrativeSnapshots as unknown as NarrativeSnapshot[];
        }
      }

      // Append new snapshot version
      snapshots.push({
        version: factVersion,
        narrative: text,
        changeSummary,
        createdAt: new Date().toISOString()
      });

      const saved = await this.prisma.complaintAssessment.create({
        data: {
          sessionId,
          factVersion,
          parentAssessmentId: parentId,
          incidentType,
          complaintReadinessScore,
          firReadinessScore,
          structuredPayload: incidentModel as any,
          extractedFacts: facts as any,
          narrativeSnapshots: snapshots as any,
          draftText
        }
      });

      // Update Session table
      await this.prisma.complaintSession.upsert({
        where: { sessionId },
        update: {
          incidentType,
          readinessScore: complaintReadinessScore,
          status,
          clarificationRequired: status === 'CLARIFYING'
        },
        create: {
          sessionId,
          incidentType,
          readinessScore: complaintReadinessScore,
          status,
          clarificationRequired: status === 'CLARIFYING'
        }
      });

      // Attach database record ID for verification
      (incidentModel as any).id = saved.id;

    } catch (dbErr) {
      this.logger.warn(`Failed to persist CIE logs: ${dbErr.message}`);
    }

    return {
      incidentType,
      complaintReadinessScore,
      firReadinessScore,
      incidentModel,
      extractedFacts: facts,
      missingInformation,
      contradictions,
      draftText,
      reviewSections,
      narrativeSnapshots: snapshots
    };
  }
}
