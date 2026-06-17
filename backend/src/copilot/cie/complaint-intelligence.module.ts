import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ComplaintIntelligenceService } from './complaint-intelligence.service';
import { ComplaintIntelligenceController } from './complaint-intelligence.controller';
import { CopilotTelemetryListener } from './copilot-telemetry.listener';

@Module({
  controllers: [ComplaintIntelligenceController],
  providers: [ComplaintIntelligenceService, PrismaService, CopilotTelemetryListener],
  exports: [ComplaintIntelligenceService],
})
export class ComplaintIntelligenceModule {}
