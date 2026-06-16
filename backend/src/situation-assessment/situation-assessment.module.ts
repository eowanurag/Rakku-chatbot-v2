import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SituationAssessmentService } from './situation-assessment.service';
import { SituationAssessmentController } from './situation-assessment.controller';
import { LocalizationModule } from '../localization/localization.module';

@Module({
  imports: [LocalizationModule],
  controllers: [SituationAssessmentController],
  providers: [SituationAssessmentService, PrismaService],
  exports: [SituationAssessmentService],
})
export class SituationAssessmentModule {}
