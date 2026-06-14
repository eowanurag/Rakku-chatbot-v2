import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JurisdictionService } from '../jurisdiction-routing/jurisdiction.service';
import { RoutingContext, ResolutionSource } from '../jurisdiction-routing/jurisdiction-routing.types';

export interface PoliceStation {
  id: string;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
}

@Injectable()
export class PoliceStationService {
  private readonly logger = new Logger(PoliceStationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jurisdictionService: JurisdictionService
  ) {}

  async getAll(): Promise<any[]> {
    return this.prisma.policeStation.findMany({ where: { isActive: true } });
  }

  async findByCity(cityQuery: string): Promise<{
    success: boolean;
    station: any;
    distanceKm: string;
    mapsUrl: string;
    demoMode?: boolean;
    suggestions?: string[];
  }> {
    this.logger.log(`Searching for police station by city query: "${cityQuery}"`);

    // Call Jurisdiction Resolution Platform
    const resolution = await this.jurisdictionService.resolveJurisdiction({
      serviceType: 'POLICE_STATION_FINDER',
      routingContext: RoutingContext.OTHER,
      location: cityQuery,
      resolutionSource: ResolutionSource.TEXT_INPUT,
    });

    if (resolution.policeStationId) {
      const dbStation = await this.prisma.policeStation.findUnique({
        where: { id: resolution.policeStationId },
      });

      if (dbStation) {
        const formattedDistance = 'Distance unavailable for manual search';
        const mapsUrl = dbStation.latitude && dbStation.longitude
          ? `https://www.google.com/maps/search/?api=1&query=${dbStation.latitude},${dbStation.longitude}`
          : '';

        return {
          success: true,
          station: {
            id: dbStation.id,
            name: dbStation.name,
            address: `${dbStation.localityCode || ''}, ${dbStation.cityCode || ''}, Uttar Pradesh`,
            phone: dbStation.phone || '0522-XXXXXXX',
            latitude: dbStation.latitude || 26.853,
            longitude: dbStation.longitude || 81.0005,
          },
          distanceKm: formattedDistance,
          mapsUrl,
        };
      }
    }

    const fallbackSuggestions = ['Barabanki', 'Bahraich', 'Basti', 'Lucknow', 'Kanpur', 'Noida'];
    return {
      success: false,
      station: null,
      distanceKm: 'Distance unknown',
      mapsUrl: '',
      suggestions: fallbackSuggestions,
    };
  }

  async findNearest(lat: number, lng: number): Promise<{
    success: boolean;
    station: any;
    distanceKm: string;
    mapsUrl: string;
  }> {
    const resolution = await this.jurisdictionService.resolveJurisdiction({
      serviceType: 'POLICE_STATION_FINDER',
      routingContext: RoutingContext.OTHER,
      location: 'GPS',
      resolutionSource: ResolutionSource.GPS,
      coordinates: { lat, lng },
    });

    if (resolution.policeStationId) {
      const dbStation = await this.prisma.policeStation.findUnique({
        where: { id: resolution.policeStationId },
      });

      if (dbStation && dbStation.latitude && dbStation.longitude) {
        const distance = this.calculateDistance(lat, lng, dbStation.latitude, dbStation.longitude);
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${dbStation.latitude},${dbStation.longitude}`;

        return {
          success: true,
          station: {
            id: dbStation.id,
            name: dbStation.name,
            address: `${dbStation.localityCode || ''}, ${dbStation.cityCode || ''}, Uttar Pradesh`,
            phone: dbStation.phone || '0522-XXXXXXX',
            latitude: dbStation.latitude,
            longitude: dbStation.longitude,
          },
          distanceKm: distance.toFixed(2),
          mapsUrl,
        };
      }
    }

    return {
      success: false,
      station: null,
      distanceKm: 'Distance unknown',
      mapsUrl: '',
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
