import { Test, TestingModule } from '@nestjs/testing';
import { LocalizationService, MetricsService } from '@backend/localization/localization.service';
import { LocalizationHealthController } from '@backend/localization/localization.health';
import * as fs from 'fs';
import * as path from 'path';

describe('Localization Integrity & Health Test Suite', () => {
  let localizationService: LocalizationService;
  let metricsService: MetricsService;
  let controller: LocalizationHealthController;

  beforeAll(async () => {
    metricsService = new MetricsService();
    localizationService = new LocalizationService(metricsService);
    controller = new LocalizationHealthController(localizationService);
    
    // Trigger module initialization (loads and validates translations)
    localizationService.onModuleInit();
  });

  it('should successfully pass validateTranslations check on healthy message library', () => {
    expect(() => localizationService.validateTranslations()).not.toThrow();
  });

  it('should throw on validation if translations are missing or invalid', () => {
    const backupLibrary = (localizationService as any).messageLibrary;
    
    // Inject a malformed key
    (localizationService as any).messageLibrary = {
      messages: {
        TEST_KEY: {
          en: "Hello",
          hi: "" // Empty value triggers failure
        }
      }
    };
    expect(() => localizationService.validateTranslations()).toThrow(/has an empty translation/);

    // Missing language
    (localizationService as any).messageLibrary = {
      messages: {
        TEST_KEY: {
          en: "Hello"
        }
      }
    };
    expect(() => localizationService.validateTranslations()).toThrow(/missing language/);

    // Restore backup
    (localizationService as any).messageLibrary = backupLibrary;
  });

  it('should fallback to English and increment missing key telemetry when key is missing', () => {
    const key = 'NON_EXISTENT_KEY_' + Math.random().toString(36).substring(7);
    const result = localizationService.translate(key, 'hi');
    expect(result).toBe(key);
    expect(metricsService.getCount('localization.missing_key')).toBeGreaterThan(0);
  });

  it('should return correct health statistics from the health endpoint', () => {
    const health = controller.getLocalizationHealth();
    expect(health.status).toBe('healthy');
    expect(health.languages).toContain('en');
    expect(health.languages).toContain('hi');
    expect(health.languages).toContain('hinglish');
    expect(health.translationKeys).toBeGreaterThan(0);
    expect(health.missingKeys).toBeGreaterThan(0);
  });
});
