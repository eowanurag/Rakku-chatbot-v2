import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { LocationRegistry, SUPPORTED_LANGUAGES, REVIEW_SECTIONS, REVIEW_FIELDS } from './localization.constants';
import { LanguageCode, LocationRegistryItem, MissingTranslationEvent } from './localization.types';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly counts = new Map<string, number>();

  increment(metric: string) {
    const newVal = (this.counts.get(metric) || 0) + 1;
    this.counts.set(metric, newVal);
    this.logger.log(`Metric incremented: ${metric} -> count: ${newVal}`);
  }

  getCount(metric: string): number {
    return this.counts.get(metric) || 0;
  }
}

@Injectable()
export class LocalizationService implements OnModuleInit {
  private readonly logger = new Logger(LocalizationService.name);
  private messageLibrary: any = null;
  private missingKeysCount = 0;

  constructor(private readonly metricsService: MetricsService) {
    this.loadMessageLibrary();
  }

  onModuleInit() {
    this.validateTranslations();
  }

  private loadMessageLibrary() {
    const pathsToSearch = [
      path.resolve(__dirname, '../../shared/message_library.json'),
      path.resolve(__dirname, '../chat/message_library.json'),
      path.resolve(__dirname, 'message_library.json'),
      path.resolve(process.cwd(), '../shared/message_library.json'),
      path.resolve(process.cwd(), 'shared/message_library.json'),
      path.resolve(process.cwd(), 'backend/src/chat/message_library.json')
    ];

    let foundPath = '';
    for (const p of pathsToSearch) {
      if (fs.existsSync(p)) {
        foundPath = p;
        break;
      }
    }

    if (foundPath) {
      try {
        const content = fs.readFileSync(foundPath, 'utf8');
        this.messageLibrary = JSON.parse(content);
        this.logger.log(`Successfully loaded Message Library from ${foundPath}`);
      } catch (e) {
        this.logger.error(`Error parsing message library from ${foundPath}: ${e.message}`);
      }
    } else {
      this.logger.error(`Could not locate message_library.json in searched paths.`);
    }
  }

  public validateTranslations() {
    if (!this.messageLibrary) {
      throw new Error('Localization System Error: Message library was not loaded.');
    }

    const messages = this.messageLibrary.messages;
    if (!messages || typeof messages !== 'object') {
      throw new Error('Localization System Error: malformed message_library structure.');
    }

    const keys = Object.keys(messages);
    for (const key of keys) {
      const translation = messages[key];
      if (!translation || typeof translation !== 'object') {
        throw new Error(`Localization System Error: key "${key}" contains malformed entries.`);
      }

      for (const lang of SUPPORTED_LANGUAGES) {
        if (!(lang in translation)) {
          throw new Error(`Localization System Error: key "${key}" is missing language "${lang}".`);
        }
        const val = translation[lang];
        if (typeof val !== 'string' || val.trim() === '') {
          throw new Error(`Localization System Error: key "${key}" has an empty translation for language "${lang}".`);
        }
      }
    }

    this.logger.log(`Validation successful. ${keys.length} keys verified for languages: [${SUPPORTED_LANGUAGES.join(', ')}].`);
  }

  public translate(key: string, language: LanguageCode, params?: Record<string, string>, workflow?: string): string {
    if (!this.messageLibrary) {
      this.loadMessageLibrary();
    }

    const messages = this.messageLibrary?.messages || {};
    const translation = messages[key];

    if (!translation) {
      this.logger.warn(`Missing translation key: "${key}"`, { key, language, workflow });
      this.metricsService.increment('localization.missing_key');
      this.missingKeysCount++;
      return key;
    }

    let text = translation[language];
    if (typeof text !== 'string' || text.trim() === '') {
      this.logger.warn(`Missing translation for key: "${key}" under language "${language}"`, { key, language, workflow });
      this.metricsService.increment('localization.missing_key');
      this.missingKeysCount++;
      // Fallback to English
      text = translation['en'] || key;
    }

    if (params && typeof text === 'string') {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v ?? ''));
      }
    }

    return text;
  }

  public localizeLocation(code: string, language: LanguageCode): string {
    const normalizedCode = code.toUpperCase().trim();
    const item = LocationRegistry.find(
      (entry) => entry.code === normalizedCode || entry.code.replace(/_/g, '') === normalizedCode.replace(/_/g, '')
    );

    if (!item) {
      return code;
    }

    const localized = item[language as keyof LocationRegistryItem];
    if (typeof localized !== 'string' || localized.trim() === '') {
      return item.en || code;
    }

    return localized;
  }

  public localizeDistrict(districtCode: string, language: LanguageCode): string {
    const normalized = districtCode.toUpperCase().trim();
    const item = LocationRegistry.find(
      (entry) => entry.type === 'DISTRICT' && (entry.code === normalized || entry.code.replace(/_/g, '') === normalized.replace(/_/g, ''))
    );
    if (!item) {
      return districtCode;
    }
    const localized = item[language as keyof LocationRegistryItem];
    if (typeof localized !== 'string' || localized.trim() === '') {
      return item.en || districtCode;
    }
    return localized;
  }

  public getAllLocalizedDistricts(language: LanguageCode): Record<string, string> {
    const districts = LocationRegistry.filter((entry) => entry.type === 'DISTRICT');
    const result: Record<string, string> = {};
    for (const d of districts) {
      const val = d[language as keyof LocationRegistryItem];
      result[d.code] = typeof val === 'string' && val.trim() !== '' ? val : d.en;
    }
    return result;
  }

  public getLocalizationHealth() {
    const isHealthy = this.messageLibrary !== null;
    let keysCount = 0;
    if (this.messageLibrary && this.messageLibrary.messages) {
      keysCount = Object.keys(this.messageLibrary.messages).length;
    }

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      languages: SUPPORTED_LANGUAGES,
      translationKeys: keysCount,
      missingKeys: this.missingKeysCount
    };
  }
}
