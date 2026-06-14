import { LocalizationService } from '../localization/localization.service';

export function getWelcomeMessage(lang: string, localizationService?: LocalizationService, sessionId?: string): string {
  if (localizationService) {
    return localizationService.translate('WELCOME_MESSAGE', lang, undefined, undefined, sessionId);
  }
  return `👮 Welcome to Rakku`;
}

export function getLanguageSelectionResponse(lang: string, localizationService?: LocalizationService, sessionId?: string): string {
  if (localizationService) {
    return localizationService.translate('LANGUAGE_SELECTION_RESPONSE', lang, undefined, undefined, sessionId);
  }
  return `Hello and welcome.`;
}
