import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from './prisma.service';

// Citizen Assistance
import { CitizenAssistanceModule } from './citizen-assistance/citizen-assistance.module';

// Complaints
import { ComplaintController } from './complaint/complaint.controller';
import { ComplaintService } from './complaint/complaint.service';

// Verifications
import { VerificationController } from './verification/verification.controller';
import { VerificationService } from './verification/verification.service';

// Character Certificates
import { CertificateController } from './certificate/certificate.controller';
import { CertificateService } from './certificate/certificate.service';

// Event Permissions
import { EventController } from './event/event.controller';
import { EventService } from './event/event.service';

// Tracking
import { TrackingController } from './tracking/tracking.controller';
import { TrackingService } from './tracking/tracking.service';

// Chat Assistant
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';

// Knowledge
import { KnowledgeController } from './knowledge/knowledge.controller';
import { KnowledgeService } from './knowledge/knowledge.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    CitizenAssistanceModule,
  ],
  controllers: [
    ComplaintController,
    VerificationController,
    CertificateController,
    EventController,
    TrackingController,
    ChatController,
    KnowledgeController,
  ],
  providers: [
    PrismaService,
    ComplaintService,
    VerificationService,
    CertificateService,
    EventService,
    TrackingService,
    ChatService,
    KnowledgeService,
  ],
})
export class AppModule {}
