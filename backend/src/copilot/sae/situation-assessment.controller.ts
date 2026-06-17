import { Controller, Post, Body, HttpCode, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma.service';
import { SituationAssessmentService } from './situation-assessment.service';
import { AssessSituationDto } from './dto/assess-situation.dto';
import { ConfirmAssessmentDto } from './dto/confirm-assessment.dto';
import { OverrideAssessmentDto } from './dto/override-assessment.dto';
import { CueService } from '../cue/runtime/cue.service';

@Controller('situation-assessment')
export class SituationAssessmentController {
  constructor(
    private readonly assessmentService: SituationAssessmentService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly cueService: CueService,
  ) {}

  @Post('assess')
  @HttpCode(HttpStatus.OK)
  async assess(@Body() dto: AssessSituationDto) {
    const { cueResult, cueMetadata } = await this.cueService.normalize(dto.message, dto.sessionId);
    const result = await this.assessmentService.assess(dto.message, dto.sessionId, 'en', cueResult, cueMetadata);
    
    // Emit telemetry event
    if (result.requiresClarification) {
      this.eventEmitter.emit('intent.clarification_required', { sessionId: dto.sessionId, result });
    } else {
      this.eventEmitter.emit('intent.detected', { sessionId: dto.sessionId, result });
    }

    return result;
  }


  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(@Body() dto: ConfirmAssessmentDto) {
    const assessment = await this.prisma.intentClassification.findUnique({
      where: { id: dto.assessmentId }
    });

    if (!assessment) {
      throw new NotFoundException('Assessment record not found');
    }

    // Update state to CONFIRMED
    const updated = await this.prisma.intentClassification.update({
      where: { id: dto.assessmentId },
      data: { assessmentStatus: 'CONFIRMED' }
    });

    await this.prisma.situationAssessmentSession.update({
      where: { sessionId: dto.sessionId },
      data: { assessmentStatus: 'CONFIRMED' }
    });

    this.eventEmitter.emit('intent.confirmed', { sessionId: dto.sessionId, assessment: updated });

    return { success: true, status: 'CONFIRMED' };
  }

  @Post('override')
  @HttpCode(HttpStatus.OK)
  async override(@Body() dto: OverrideAssessmentDto) {
    const assessment = await this.prisma.intentClassification.findUnique({
      where: { id: dto.assessmentId }
    });

    if (!assessment) {
      throw new NotFoundException('Assessment record not found');
    }

    // Versioning chain increments on override
    const nextVersion = assessment.assessmentVersion + 1;
    const parentId = assessment.id;

    // Create a new overridden assessment record
    const saved = await this.prisma.intentClassification.create({
      data: {
        sessionId: dto.sessionId,
        assessmentVersion: nextVersion,
        parentAssessmentId: parentId,
        rawNarrative: assessment.rawNarrative,
        predictedIntent: assessment.predictedIntent,
        citizenSelectedIntent: dto.citizenSelectedIntent,
        citizenSelectedService: dto.citizenSelectedService || null,
        incidentCategory: assessment.incidentCategory,
        recommendedServices: assessment.recommendedServices,
        recommendedActions: assessment.recommendedActions,
        confidence: assessment.confidence,
        confidenceBand: assessment.confidenceBand,
        recommendationConfidence: assessment.recommendationConfidence,
        recommendationConfidenceBand: assessment.recommendationConfidenceBand,
        urgency: assessment.urgency,
        assessmentStatus: 'CONFIRMED', // Once citizen overrides and submits, it acts as confirmation of the overridden choice
        storyCompleteness: assessment.storyCompleteness,
        detectedEntities: assessment.detectedEntities || {},
        reasoning: { note: "Overridden by citizen" }
      }
    });

    // Update parent assessment to show it was overridden/rejected
    await this.prisma.intentClassification.update({
      where: { id: dto.assessmentId },
      data: { assessmentStatus: 'REJECTED' }
    });

    await this.prisma.situationAssessmentSession.update({
      where: { sessionId: dto.sessionId },
      data: {
        latestIntent: dto.citizenSelectedIntent,
        assessmentStatus: 'CONFIRMED',
        clarificationRequired: false
      }
    });

    this.eventEmitter.emit('intent.overridden', { sessionId: dto.sessionId, oldAssessment: assessment, newAssessment: saved });

    return { success: true, status: 'CONFIRMED', newAssessmentId: saved.id };
  }
}
