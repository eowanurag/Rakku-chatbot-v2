import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from './prisma.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Citizen Assistance
import { CitizenAssistanceModule } from './citizen-assistance/citizen-assistance.module';

// Chat Assistant
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { ValidationService } from './chat/validation.service';

// Knowledge
import { KnowledgeController } from './knowledge/knowledge.controller';
import { KnowledgeService } from './knowledge/knowledge.service';
import { IntelligenceService } from './citizen-assistance/intelligence.service';

import { LocalizationModule } from './localization/localization.module';
import { JurisdictionRoutingModule } from './jurisdiction-routing/jurisdiction-routing.module';
import { NotificationModule } from './notification/notification.module';

// Separation Sprint Modules
import { CopilotModule } from './copilot/copilot.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { OrchestrationModule } from './orchestration/orchestration.module';

// Middleware
import { PayloadProtectionMiddleware } from './common/payload-protection.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 60,
    }]),
    CitizenAssistanceModule,
    LocalizationModule,
    JurisdictionRoutingModule,
    NotificationModule,
    CopilotModule,
    WorkflowsModule,
    OrchestrationModule,
  ],
  controllers: [
    ChatController,
    KnowledgeController,
  ],
  providers: [
    PrismaService,
    ChatService,
    ValidationService,
    KnowledgeService,
    IntelligenceService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PayloadProtectionMiddleware)
      .forRoutes('*');
  }
}


