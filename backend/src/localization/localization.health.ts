import { Controller, Get } from '@nestjs/common';
import { LocalizationService } from './localization.service';

@Controller('health')
export class LocalizationHealthController {
  constructor(private readonly localizationService: LocalizationService) {}

  @Get('localization')
  getLocalizationHealth() {
    return this.localizationService.getLocalizationHealth();
  }
}
