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
