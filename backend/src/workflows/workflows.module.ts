import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SubmissionFingerprintService } from '../security/submission-fingerprint.service';

import { ComplaintController } from './complaint/complaint.controller';
import { ComplaintService } from './complaint/complaint.service';

import { CertificateController } from './certificate/certificate.controller';
import { CertificateService } from './certificate/certificate.service';

import { VerificationController } from './verification/verification.controller';
import { VerificationService } from './verification/verification.service';

import { EventController } from './event/event.controller';
import { EventService } from './event/event.service';

import { TrackingController } from './tracking/tracking.controller';
import { TrackingService } from './tracking/tracking.service';

@Module({
  controllers: [
    ComplaintController,
    CertificateController,
    VerificationController,
    EventController,
    TrackingController,
  ],
  providers: [
    PrismaService,
    SubmissionFingerprintService,
    ComplaintService,
    CertificateService,
    VerificationService,
    EventService,
    TrackingService,
  ],
  exports: [
    ComplaintService,
    CertificateService,
    VerificationService,
    EventService,
    TrackingService,
  ],
})
export class WorkflowsModule {}
