import { Controller, Get, Post, Query, Body, BadRequestException } from '@nestjs/common';
import { HelplineService } from './helpline.service';
import { PoliceStationService } from './police-station.service';
import { AnalyticsService } from './analytics.service';

@Controller('citizen-assistance')
export class CitizenAssistanceController {
  constructor(
    private readonly helplineService: HelplineService,
    private readonly policeStationService: PoliceStationService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get('helplines')
  getHelplines() {
    return this.helplineService.getAll();
  }

  @Get('police-stations/nearest')
  getNearestPoliceStation(
    @Query('lat') latStr?: string,
    @Query('lng') lngStr?: string,
  ) {
    if (!latStr || !lngStr) {
      throw new BadRequestException('Query parameters "lat" and "lng" are required.');
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      throw new BadRequestException('Query parameters "lat" and "lng" must be numbers.');
    }

    this.analyticsService.trackPoliceStationSearch();
    return this.policeStationService.findNearest(lat, lng);
  }

  @Get('analytics/summary')
  getAnalyticsSummary() {
    return this.analyticsService.getSummary();
  }

  @Post('analytics/track')
  trackMetric(
    @Body() body: { type: string; value?: string },
  ) {
    const { type, value } = body;
    switch (type) {
      case 'help_requests':
        this.analyticsService.trackHelpRequest();
        break;
      case 'police_station_searches':
        this.analyticsService.trackPoliceStationSearch();
        break;
      case 'emergency_overrides':
        this.analyticsService.trackEmergencyOverride();
        break;
      case 'helpline_recommendations':
        if (value) {
          this.analyticsService.trackHelplineRecommendation(value);
        }
        break;
      case 'language_distribution':
        if (value) {
          this.analyticsService.trackLanguage(value);
        }
        break;
      default:
        throw new BadRequestException(`Unknown metric type: ${type}`);
    }
    return { success: true };
  }
}
