import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CopilotTelemetryListener {
  private readonly logger = new Logger(CopilotTelemetryListener.name);

  constructor(private readonly prisma: PrismaService) {}

  private maskPII(text: string): string {
    if (typeof text !== 'string') return text;
    let masked = text;
    // Aadhaar (12 digits, e.g. 1234-5678-9012 or 1234 5678 9012 or 123456789012)
    masked = masked.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, 'XXXX-XXXX-XXXX');
    // Mobile numbers (Indian style: +91 9876543210, 9876543210)
    masked = masked.replace(/\b(?:\+?91[-\s]?)?[6-9]\d{9}\b/g, 'XXXXXX-XXXX');
    // UPI ID (e.g. user@okhdfcbank, john.doe@ybl)
    masked = masked.replace(/\b[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b/g, 'XXXX@XXXX');
    // PIN code (6 digits)
    masked = masked.replace(/\b\d{6}\b/g, 'XXXXXX');
    return masked;
  }

  private sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') {
      return this.maskPII(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    if (typeof obj === 'object') {
      const res: any = {};
      
      const isFactWithLocation = 
        typeof obj.field === 'string' && 
        (obj.field.toLowerCase().includes('location') || 
         obj.field.toLowerCase().includes('address') || 
         obj.field.toLowerCase().includes('aadhar') || 
         obj.field.toLowerCase().includes('phone') || 
         obj.field.toLowerCase().includes('contact'));
      
      for (const key of Object.keys(obj)) {
        const lowerKey = key.toLowerCase();
        if (isFactWithLocation && key === 'value') {
          if (obj.field.toLowerCase().includes('location') || obj.field.toLowerCase().includes('address')) {
            res[key] = '[MASKED_ADDRESS]';
          } else {
            res[key] = this.maskPII(obj[key]);
          }
        } else if (lowerKey.includes('address') || lowerKey.includes('location')) {
          if (typeof obj[key] === 'string') {
            res[key] = '[MASKED_ADDRESS]';
          } else {
            res[key] = this.sanitizeObject(obj[key]);
          }
        } else {
          res[key] = this.sanitizeObject(obj[key]);
        }
      }
      return res;
    }
    return obj;
  }

  @OnEvent('intent.detected')
  async handleIntentDetected(event: { sessionId: string; result: any }) {
    try {
      const eventData = this.sanitizeObject({
        predictedIntent: event.result.predictedIntent,
        confidence: event.result.confidence,
        urgency: event.result.urgency,
        recommendedServices: event.result.recommendedServices,
        rawText: event.result.rawText,
        rawNarrative: event.result.rawNarrative,
        narrative: event.result.narrative,
      });

      await this.prisma.auditLog.create({
        data: {
          sessionId: event.sessionId,
          eventType: 'INTENT_DETECTED',
          eventData,
        },
      });
      this.logger.log(`Logged INTENT_DETECTED telemetry for session=${event.sessionId}`);
    } catch (err) {
      this.logger.error(`Telemetry persistence failed for INTENT_DETECTED: ${err.message}`);
    }
  }

  @OnEvent('intent.clarification_required')
  async handleIntentClarification(event: { sessionId: string; result: any }) {
    try {
      const eventData = this.sanitizeObject({
        predictedIntent: event.result.predictedIntent,
        confidence: event.result.confidence,
        recommendedActions: event.result.recommendedActions,
      });

      await this.prisma.auditLog.create({
        data: {
          sessionId: event.sessionId,
          eventType: 'INTENT_CLARIFICATION_REQUIRED',
          eventData,
        },
      });
      this.logger.log(`Logged INTENT_CLARIFICATION_REQUIRED telemetry for session=${event.sessionId}`);
    } catch (err) {
      this.logger.error(`Telemetry persistence failed for INTENT_CLARIFICATION_REQUIRED: ${err.message}`);
    }
  }

  @OnEvent('intent.confirmed')
  async handleIntentConfirmed(event: { sessionId: string; assessment: any }) {
    try {
      const eventData = this.sanitizeObject({
        assessmentId: event.assessment.id,
        intent: event.assessment.citizenSelectedIntent || event.assessment.predictedIntent,
      });

      await this.prisma.auditLog.create({
        data: {
          sessionId: event.sessionId,
          eventType: 'INTENT_CONFIRMED',
          eventData,
        },
      });
      this.logger.log(`Logged INTENT_CONFIRMED telemetry for session=${event.sessionId}`);
    } catch (err) {
      this.logger.error(`Telemetry persistence failed for INTENT_CONFIRMED: ${err.message}`);
    }
  }

  @OnEvent('intent.overridden')
  async handleIntentOverridden(event: { sessionId: string; oldAssessment: any; newAssessment: any }) {
    try {
      const eventData = this.sanitizeObject({
        oldAssessmentId: event.oldAssessment.id,
        newAssessmentId: event.newAssessment.id,
        oldIntent: event.oldAssessment.predictedIntent,
        newIntent: event.newAssessment.citizenSelectedIntent,
      });

      await this.prisma.auditLog.create({
        data: {
          sessionId: event.sessionId,
          eventType: 'INTENT_OVERRIDDEN',
          eventData,
        },
      });
      this.logger.log(`Logged INTENT_OVERRIDDEN telemetry for session=${event.sessionId}`);
    } catch (err) {
      this.logger.error(`Telemetry persistence failed for INTENT_OVERRIDDEN: ${err.message}`);
    }
  }

  @OnEvent('fact.extracted')
  async handleFactExtracted(event: { sessionId: string; result: any }) {
    try {
      const eventData = this.sanitizeObject({
        incidentType: event.result.incidentType,
        complaintReadinessScore: event.result.complaintReadinessScore,
        firReadinessScore: event.result.firReadinessScore,
        factCount: event.result.extractedFacts ? event.result.extractedFacts.length : 0,
        // Make sure we sanitize extractedFacts or elements if they might leak PII
        extractedFacts: event.result.extractedFacts,
      });

      await this.prisma.auditLog.create({
        data: {
          sessionId: event.sessionId,
          eventType: 'FACT_EXTRACTED',
          eventData,
        },
      });
      this.logger.log(`Logged FACT_EXTRACTED telemetry for session=${event.sessionId}`);
    } catch (err) {
      this.logger.error(`Telemetry persistence failed for FACT_EXTRACTED: ${err.message}`);
    }
  }

  @OnEvent('fact.contradiction_detected')
  async handleContradictionDetected(event: { sessionId: string; contradictions: any[] }) {
    try {
      const eventData = this.sanitizeObject({
        contradictions: event.contradictions,
      });

      await this.prisma.auditLog.create({
        data: {
          sessionId: event.sessionId,
          eventType: 'FACT_CONTRADICTION_DETECTED',
          eventData,
        },
      });
      this.logger.log(`Logged FACT_CONTRADICTION_DETECTED telemetry for session=${event.sessionId}`);
    } catch (err) {
      this.logger.error(`Telemetry persistence failed for FACT_CONTRADICTION_DETECTED: ${err.message}`);
    }
  }

  @OnEvent('clarification.requested')
  async handleClarificationRequested(event: { sessionId: string; missing: any[] }) {
    try {
      const eventData = this.sanitizeObject({
        missingFields: event.missing,
      });

      await this.prisma.auditLog.create({
        data: {
          sessionId: event.sessionId,
          eventType: 'CLARIFICATION_REQUESTED',
          eventData,
        },
      });
      this.logger.log(`Logged CLARIFICATION_REQUESTED telemetry for session=${event.sessionId}`);
    } catch (err) {
      this.logger.error(`Telemetry persistence failed for CLARIFICATION_REQUESTED: ${err.message}`);
    }
  }

  @OnEvent('complaint.draft_generated')
  async handleDraftGenerated(event: { sessionId: string; draft: string }) {
    try {
      const eventData = this.sanitizeObject({
        draftLength: event.draft ? event.draft.length : 0,
        // We only log length of draft to avoid PII leak, but let's sanitize just in case
      });

      await this.prisma.auditLog.create({
        data: {
          sessionId: event.sessionId,
          eventType: 'COMPLAINT_DRAFT_GENERATED',
          eventData,
        },
      });
      this.logger.log(`Logged COMPLAINT_DRAFT_GENERATED telemetry for session=${event.sessionId}`);
    } catch (err) {
      this.logger.error(`Telemetry persistence failed for COMPLAINT_DRAFT_GENERATED: ${err.message}`);
    }
  }

  @OnEvent('complaint.approved')
  async handleComplaintApproved(event: { sessionId: string; assessmentId: string }) {
    try {
      const eventData = this.sanitizeObject({
        assessmentId: event.assessmentId,
      });

      await this.prisma.auditLog.create({
        data: {
          sessionId: event.sessionId,
          eventType: 'COMPLAINT_APPROVED',
          eventData,
        },
      });
      this.logger.log(`Logged COMPLAINT_APPROVED telemetry for session=${event.sessionId}`);
    } catch (err) {
      this.logger.error(`Telemetry persistence failed for COMPLAINT_APPROVED: ${err.message}`);
    }
  }

  @OnEvent('complaint.rejected')
  async handleComplaintRejected(event: { sessionId: string; oldAssessmentId: string; newAssessmentId: string }) {
    try {
      const eventData = this.sanitizeObject({
        oldAssessmentId: event.oldAssessmentId,
        newAssessmentId: event.newAssessmentId,
      });

      await this.prisma.auditLog.create({
        data: {
          sessionId: event.sessionId,
          eventType: 'COMPLAINT_REJECTED',
          eventData,
        },
      });
      this.logger.log(`Logged COMPLAINT_REJECTED telemetry for session=${event.sessionId}`);
    } catch (err) {
      this.logger.error(`Telemetry persistence failed for COMPLAINT_REJECTED: ${err.message}`);
    }
  }
}
