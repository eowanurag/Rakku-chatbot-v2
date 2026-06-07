import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface AnalyticsSummary {
  help_requests: number;
  police_station_searches: number;
  helpline_recommendations: Record<string, number>;
  emergency_overrides: number;
  language_distribution: Record<string, number>;
}

@Injectable()
export class AnalyticsService {
  private analytics: AnalyticsSummary = {
    help_requests: 0,
    police_station_searches: 0,
    helpline_recommendations: {},
    emergency_overrides: 0,
    language_distribution: {
      en: 0,
      hi: 0,
      hinglish: 0,
    },
  };

  private readonly filePath = path.join(process.cwd(), 'analytics.json');

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(fileContent);
        this.analytics = {
          help_requests: parsed.help_requests || 0,
          police_station_searches: parsed.police_station_searches || 0,
          helpline_recommendations: parsed.helpline_recommendations || {},
          emergency_overrides: parsed.emergency_overrides || 0,
          language_distribution: parsed.language_distribution || { en: 0, hi: 0, hinglish: 0 },
        };
      }
    } catch (e) {
      console.error('Failed to load analytics file, fallback to default.', e);
    }
  }

  private save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.analytics, null, 2));
    } catch (e) {
      console.error('Failed to save analytics file.', e);
    }
  }

  trackHelpRequest() {
    this.analytics.help_requests++;
    this.save();
  }

  trackPoliceStationSearch() {
    this.analytics.police_station_searches++;
    this.save();
  }

  trackHelplineRecommendation(helpline: string) {
    this.analytics.helpline_recommendations[helpline] =
      (this.analytics.helpline_recommendations[helpline] || 0) + 1;
    this.save();
  }

  trackEmergencyOverride() {
    this.analytics.emergency_overrides++;
    this.save();
  }

  trackLanguage(lang: string) {
    if (lang === 'en' || lang === 'hi' || lang === 'hinglish') {
      this.analytics.language_distribution[lang] =
        (this.analytics.language_distribution[lang] || 0) + 1;
      this.save();
    }
  }

  getSummary(): AnalyticsSummary {
    return this.analytics;
  }
}
