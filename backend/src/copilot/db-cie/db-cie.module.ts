import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { DuplicateComplaintService } from './services/duplicate-complaint.service';
import { IncidentClusteringService } from './services/incident-clustering.service';

@Module({
  providers: [DuplicateComplaintService, IncidentClusteringService, PrismaService],
  exports: [DuplicateComplaintService, IncidentClusteringService],
})
export class DbCieModule {}
