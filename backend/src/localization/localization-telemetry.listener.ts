import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma.service';
import {
  LocalizationMissingTranslationEvent,
  LocalizationFallbackEvent,
  LanguageSwitchEvent,
  LocalizationErrorEvent,
} from './localization.types';

@Injectable()
export class LocalizationTelemetryListener {
  private readonly logger = new Logger(LocalizationTelemetryListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('LocalizationMissingTranslation')
  async handleMissingTranslation(event: LocalizationMissingTranslationEvent) {
    try {
      await this.prisma.auditLog.create({
        data: {
          sessionId: event.sessionId,
          eventType: 'MISSING_TRANSLATION',
          eventData: {
            key: event.key,
            language: event.language,
            workflow: event.workflow || null,
          },
        },
      });
      this.logger.warn(`Logged MISSING_TRANSLATION telemetry for session=${event.sessionId}, key=${event.key}`);
    } catch (err) {
      this.logger.error(`Telemetry persistence failed for MISSING_TRANSLATION: ${err.message}`);
    }
  }

  @OnEvent('LocalizationFallback')
  async handleFallback(event: LocalizationFallbackEvent) {
    try {
      await this.prisma.auditLog.create({
        data: {
          sessionId: event.sessionId,
          eventType: 'TRANSLATION_FALLBACK',
          eventData: {
            key: event.key,
            requestedLanguage: event.requestedLanguage,
            fallbackLanguage: event.fallbackLanguage,
            workflow: event.workflow || null,
          },
        },
      });
      this.logger.log(`Logged TRANSLATION_FALLBACK telemetry for session=${event.sessionId}, key=${event.key}`);
    } catch (err) {
      this.logger.error(`Telemetry persistence failed for TRANSLATION_FALLBACK: ${err.message}`);
    }
  }

  @OnEvent('LanguageSwitch')
  async handleLanguageSwitch(event: LanguageSwitchEvent) {
    try {
      await this.prisma.auditLog.create({
        data: {
          sessionId: event.sessionId,
          eventType: 'LANGUAGE_SWITCH',
          eventData: {
            from: event.from,
            to: event.to,
          },
        },
      });
      this.logger.log(`Logged LANGUAGE_SWITCH telemetry for session=${event.sessionId}: ${event.from} -> ${event.to}`);
    } catch (err) {
      this.logger.error(`Telemetry persistence failed for LANGUAGE_SWITCH: ${err.message}`);
    }
  }

  @OnEvent('LocalizationError')
  async handleLocalizationError(event: LocalizationErrorEvent) {
    try {
      await this.prisma.auditLog.create({
        data: {
          sessionId: event.sessionId || 'SYSTEM',
          eventType: 'LOCALIZATION_ERROR',
          eventData: {
            error: event.error,
            details: event.details || null,
          },
        },
      });
      this.logger.error(`Logged LOCALIZATION_ERROR telemetry: ${event.error}`);
    } catch (err) {
      this.logger.error(`Telemetry persistence failed for LOCALIZATION_ERROR: ${err.message}`);
    }
  }
}
