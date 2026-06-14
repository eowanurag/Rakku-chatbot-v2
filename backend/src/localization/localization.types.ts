export type LanguageCode = string;

export interface MissingTranslationEvent {
  eventType: 'MISSING_MESSAGE';
  key: string;
  language: string;
  workflow?: string;
  service?: string;
  timestamp: Date;
}

export interface LocationRegistryItem {
  type: 'STATE' | 'DISTRICT';
  code: string;
  stateCode?: string;
  en: string;
  hi: string;
  hinglish: string;
}

export class LocalizationMissingTranslationEvent {
  constructor(
    public readonly sessionId: string,
    public readonly key: string,
    public readonly language: string,
    public readonly workflow?: string,
  ) {}
}

export class LocalizationFallbackEvent {
  constructor(
    public readonly sessionId: string,
    public readonly key: string,
    public readonly requestedLanguage: string,
    public readonly fallbackLanguage: string,
    public readonly workflow?: string,
  ) {}
}

export class LanguageSwitchEvent {
  constructor(
    public readonly sessionId: string,
    public readonly from: string,
    public readonly to: string,
  ) {}
}

export class LocalizationErrorEvent {
  constructor(
    public readonly error: string,
    public readonly sessionId?: string,
    public readonly details?: any,
  ) {}
}

