import { EventEmitter2 } from '@nestjs/event-emitter';
import { LocalizationService, MetricsService } from '@backend/localization/localization.service';
import { LocalizationTelemetryListener } from '@backend/localization/localization-telemetry.listener';
import { PrismaService } from '@backend/prisma.service';

describe('Localization Telemetry Test Suite', () => {
  let localizationService: LocalizationService;
  let eventEmitter: EventEmitter2;
  let prisma: PrismaService;
  let listener: LocalizationTelemetryListener;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();

    const metrics = new MetricsService();
    eventEmitter = new EventEmitter2();
    localizationService = new LocalizationService(metrics, eventEmitter);
    listener = new LocalizationTelemetryListener(prisma);

    // Manually bridge events to the telemetry listener
    eventEmitter.on('LocalizationMissingTranslation', (ev) => listener.handleMissingTranslation(ev));
    eventEmitter.on('LocalizationFallback', (ev) => listener.handleFallback(ev));
    eventEmitter.on('LanguageSwitch', (ev) => listener.handleLanguageSwitch(ev));
    eventEmitter.on('LocalizationError', (ev) => listener.handleLocalizationError(ev));
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should emit and log missing translation event', async () => {
    const sessionId = 'test-session-missing-' + Math.random().toString(36).substring(7);
    
    // Set a clean message library
    localizationService['messageLibrary'] = {
      messages: {}
    };

    // Trigger translate for a missing key
    localizationService.translate('NON_EXISTENT_KEY_123', 'en', undefined, sessionId);

    // Wait a brief moment for async event emitter dispatch
    await new Promise((resolve) => setTimeout(resolve, 300));

    const auditLogs = await prisma.auditLog.findMany({
      where: { sessionId, eventType: 'MISSING_TRANSLATION' },
    });

    expect(auditLogs.length).toBeGreaterThanOrEqual(1);
    expect((auditLogs[0].eventData as any).key).toBe('NON_EXISTENT_KEY_123');
  });

  it('should emit and log translation fallback event', async () => {
    const sessionId = 'test-session-fallback-' + Math.random().toString(36).substring(7);

    // Mock a translation key missing Hindi but having English
    localizationService['messageLibrary'] = {
      messages: {
        TEST_KEY_FALLBACK: {
          en: 'English translation',
          hi: '',
        }
      }
    };

    // Trigger translation with empty key under 'hi'
    localizationService.translate('TEST_KEY_FALLBACK', 'hi', undefined, sessionId);

    await new Promise((resolve) => setTimeout(resolve, 300));

    const auditLogs = await prisma.auditLog.findMany({
      where: { sessionId, eventType: 'TRANSLATION_FALLBACK' },
    });

    expect(auditLogs.length).toBeGreaterThanOrEqual(1);
    expect((auditLogs[0].eventData as any).key).toBe('TEST_KEY_FALLBACK');
    expect((auditLogs[0].eventData as any).requestedLanguage).toBe('hi');
  });

  it('should emit and log language switch event', async () => {
    const sessionId = 'test-session-lang-switch-' + Math.random().toString(36).substring(7);

    localizationService.logLanguageSwitch(sessionId, 'en', 'hi');

    await new Promise((resolve) => setTimeout(resolve, 300));

    const auditLogs = await prisma.auditLog.findMany({
      where: { sessionId, eventType: 'LANGUAGE_SWITCH' },
    });

    expect(auditLogs.length).toBe(1);
    expect((auditLogs[0].eventData as any).from).toBe('en');
    expect((auditLogs[0].eventData as any).to).toBe('hi');
  });
});
