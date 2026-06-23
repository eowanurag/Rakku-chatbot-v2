import { Controller, Get, Post, Query, Body, BadRequestException, Logger } from '@nestjs/common';
import { HelplineService } from './helpline.service';
import { PoliceStationService } from './police-station.service';
import { AnalyticsService } from './analytics.service';
import { CitizenMetricsService } from '../copilot/workflow-completion/citizen-metrics.service';

@Controller('citizen-assistance')
export class CitizenAssistanceController {
  private readonly logger = new Logger(CitizenAssistanceController.name);

  constructor(
    private readonly helplineService: HelplineService,
    private readonly policeStationService: PoliceStationService,
    private readonly analyticsService: AnalyticsService,
    private readonly citizenMetricsService: CitizenMetricsService,
  ) {}

  @Get('metrics')
  async getMetrics() {
    const operational = await this.citizenMetricsService.getOperationalMetrics();
    const intelligence = await this.citizenMetricsService.getIntelligenceMetrics();
    return {
      success: true,
      operational,
      intelligence
    };
  }

  @Get('helplines')
  getHelplines() {
    return this.helplineService.getAll();
  }

  @Get('police-stations/nearest')
  getNearestPoliceStation(
    @Query('lat') latStr?: string,
    @Query('lng') lngStr?: string,
    @Query('city') cityQuery?: string,
  ) {
    if (cityQuery) {
      this.analyticsService.trackPoliceStationSearch();
      return this.policeStationService.findByCity(cityQuery);
    }

    if (!latStr || !lngStr) {
      this.logger.warn('Location lookup requested but coordinates (lat/lng) are missing.');
      return {
        success: false,
        reason: 'LOCATION_NOT_AVAILABLE',
        message: 'Please provide your city or area.',
      };
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      this.logger.warn(`Invalid coordinate formats received: lat="${latStr}", lng="${lngStr}"`);
      return {
        success: false,
        reason: 'LOCATION_NOT_AVAILABLE',
        message: 'Please provide your city or area.',
      };
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
      case 'location_permission_denied':
        this.logger.warn('Telemetry: Location permission denied by citizen.');
        break;
      case 'geolocation_timeout':
        this.logger.warn('Telemetry: Geolocation timeout encountered.');
        break;
      case 'manual_search_used':
        this.logger.log(`Telemetry: Manual search used for location: "${value || 'unknown'}"`);
        break;
      case 'demo_mode_triggered':
        this.logger.warn('Telemetry: Empty database encountered. Demo Mode active.');
        break;
      case 'police_station_api_failure':
        this.logger.error(`Telemetry: Police Station Lookup API failure: "${value || 'unknown'}"`);
        break;
      default:
        throw new BadRequestException(`Unknown metric type: ${type}`);
    }
    return { success: true };
  }
}
