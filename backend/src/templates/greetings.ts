import { LocalizationService } from '../localization/localization.service';

export function getWelcomeMessage(lang: string, localizationService?: LocalizationService): string {
  if (localizationService) {
    return localizationService.translate('WELCOME_MESSAGE', lang);
  }
  return `👮 Welcome to Rakku`;
}

export function getLanguageSelectionResponse(lang: string, localizationService?: LocalizationService): string {
  if (localizationService) {
    return localizationService.translate('LANGUAGE_SELECTION_RESPONSE', lang);
  }
  return `Hello and welcome.`;
}
