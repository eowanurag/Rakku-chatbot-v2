import { Controller, Post, Body, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma.service';
import { ComplaintIntelligenceService } from './complaint-intelligence.service';
import { AssessComplaintDto } from './dto/assess-complaint.dto';
import { ConfirmComplaintDto } from './dto/confirm-complaint.dto';
import { OverrideComplaintDto } from './dto/override-complaint.dto';

@Controller('complaint-intelligence')
export class ComplaintIntelligenceController {
  constructor(
    private readonly service: ComplaintIntelligenceService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  @Post('assess')
  @HttpCode(HttpStatus.OK)
  async assess(@Body() dto: AssessComplaintDto) {
    const result = await this.service.assess(
      dto.message,
      dto.sessionId,
      dto.incidentType,
      dto.language || 'en',
      dto.changeSummary
    );

    // Emit Telemetry
    this.eventEmitter.emit('fact.extracted', { sessionId: dto.sessionId, result });

    if (result.contradictions && result.contradictions.length > 0) {
      this.eventEmitter.emit('fact.contradiction_detected', { sessionId: dto.sessionId, contradictions: result.contradictions });
    }

    if (result.missingInformation && result.missingInformation.length > 0) {
      this.eventEmitter.emit('clarification.requested', { sessionId: dto.sessionId, missing: result.missingInformation });
    }

    if (result.draftText) {
      this.eventEmitter.emit('complaint.draft_generated', { sessionId: dto.sessionId, draft: result.draftText });
    }

    return result;
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(@Body() dto: ConfirmComplaintDto) {
    const assessment = await this.prisma.complaintAssessment.findUnique({
      where: { id: dto.assessmentId }
    });

    if (!assessment) {
      throw new NotFoundException('Complaint assessment record not found');
    }

    // Update session table state
    await this.prisma.complaintSession.update({
      where: { sessionId: dto.sessionId },
      data: {
        status: 'APPROVED',
        draftApproved: true
      }
    });

    this.eventEmitter.emit('complaint.approved', { sessionId: dto.sessionId, assessmentId: dto.assessmentId });

    return { success: true, status: 'APPROVED' };
  }

  @Post('override')
  @HttpCode(HttpStatus.OK)
  async override(@Body() dto: OverrideComplaintDto) {
    const assessment = await this.prisma.complaintAssessment.findUnique({
      where: { id: dto.assessmentId }
    });

    if (!assessment) {
      throw new NotFoundException('Complaint assessment record not found');
    }

    // Versioning chain increments on override
    const nextVersion = assessment.factVersion + 1;
    const parentId = assessment.id;

    // Append narrative snapshot
    const snapshots = typeof assessment.narrativeSnapshots === 'string'
      ? JSON.parse(assessment.narrativeSnapshots)
      : assessment.narrativeSnapshots as any || [];

    snapshots.push({
      version: nextVersion,
      narrative: assessment.draftText,
      changeSummary: `Overridden to ${dto.citizenSelectedIntent}`
    });

    const saved = await this.prisma.complaintAssessment.create({
      data: {
        sessionId: dto.sessionId,
        factVersion: nextVersion,
        parentAssessmentId: parentId,
        incidentType: dto.citizenSelectedIntent,
        complaintReadinessScore: assessment.complaintReadinessScore,
        firReadinessScore: assessment.firReadinessScore,
        structuredPayload: assessment.structuredPayload || {},
        extractedFacts: assessment.extractedFacts || {},
        narrativeSnapshots: snapshots,
        draftText: `Overridden to ${dto.citizenSelectedIntent}`
      }
    });

    await this.prisma.complaintSession.update({
      where: { sessionId: dto.sessionId },
      data: {
        incidentType: dto.citizenSelectedIntent,
        status: 'SUBMITTED'
      }
    });

    this.eventEmitter.emit('complaint.rejected', { sessionId: dto.sessionId, oldAssessmentId: dto.assessmentId, newAssessmentId: saved.id });

    return { success: true, status: 'SUBMITTED', newAssessmentId: saved.id };
  }
}
