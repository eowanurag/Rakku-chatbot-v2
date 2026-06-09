import { Injectable, Logger } from '@nestjs/common';

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
  private readonly stations: PoliceStation[] = [
    {
      id: 'ps_hazratganj',
      name: 'Hazratganj Police Station',
      address: 'Hazratganj, Lucknow, Uttar Pradesh 226001',
      phone: '0522-2200201',
      latitude: 26.8467,
      longitude: 80.9462,
    },
    {
      id: 'ps_gomtinagar',
      name: 'Gomti Nagar Police Station',
      address: 'Vibhuti Khand, Gomti Nagar, Lucknow, Uttar Pradesh 226010',
      phone: '0522-2300304',
      latitude: 26.8530,
      longitude: 81.0005,
    },
    {
      id: 'ps_aliganj',
      name: 'Aliganj Police Station',
      address: 'Sector Q, Aliganj, Lucknow, Uttar Pradesh 226024',
      phone: '0522-2400405',
      latitude: 26.8900,
      longitude: 80.9385,
    },
    {
      id: 'ps_charbagh',
      name: 'Charbagh GRP Police Station',
      address: 'Railway Station Road, Charbagh, Lucknow, Uttar Pradesh 226004',
      phone: '0522-2500506',
      latitude: 26.8322,
      longitude: 80.9234,
    },
    {
      id: 'ps_indiranagar',
      name: 'Indira Nagar Police Station',
      address: 'Sector 12, Indira Nagar, Lucknow, Uttar Pradesh 226016',
      phone: '0522-2600607',
      latitude: 26.8850,
      longitude: 80.9980,
    },
  ];

  getAll(): PoliceStation[] {
    return this.stations;
  }

  private normalizeLocationInput(input: string): string {
    const clean = input.trim().toLowerCase();
    const mappings: { [key: string]: string } = {
      'gomti nagar': 'lucknow',
      'hazratganj': 'lucknow',
      'aliganj': 'lucknow',
      'indirapuram': 'ghaziabad',
      'sector 62': 'noida',
      'civil lines': 'prayagraj',
      'sector 58': 'noida',
      'kalyanpur': 'kanpur',
      'cantonment': 'varanasi',
    };

    for (const key of Object.keys(mappings)) {
      if (clean.includes(key)) {
        return mappings[key];
      }
    }

    return clean;
  }

  findByCity(cityQuery: string): { success: boolean; station: PoliceStation; distanceKm: string; mapsUrl: string; demoMode?: boolean } {
    this.logger.log(`Searching for police station by city query: "${cityQuery}"`);
    const normalizedCity = this.normalizeLocationInput(cityQuery);

    if (!this.stations || this.stations.length === 0) {
      this.logger.warn('Empty police station database. Triggering Demo Mode fallback mock station.');
      return {
        success: true,
        demoMode: true,
        station: {
          id: 'ps_mock_gomtinagar',
          name: 'Gomti Nagar Police Station',
          address: 'Gomti Nagar, Lucknow',
          phone: '0522-XXXXXXX',
          latitude: 26.8530,
          longitude: 81.0005,
        },
        distanceKm: '0.00',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=26.8530,81.0005',
      };
    }

    let matched = this.stations.filter(s =>
      s.address.toLowerCase().includes(normalizedCity) ||
      s.name.toLowerCase().includes(normalizedCity)
    );

    if (matched.length === 0) {
      if (normalizedCity.includes('lucknow')) {
        matched = this.stations.filter(s => s.address.toLowerCase().includes('lucknow'));
      } else if (normalizedCity.includes('kanpur')) {
        return {
          success: true,
          station: {
            id: 'ps_kanpur',
            name: 'Kalyanpur Police Station',
            address: 'Kalyanpur, Kanpur, Uttar Pradesh 208017',
            phone: '0512-XXXXXXX',
            latitude: 26.4950,
            longitude: 80.2580,
          },
          distanceKm: '0.00',
          mapsUrl: 'https://www.google.com/maps/search/?api=1&query=26.4950,80.2580',
        };
      } else if (normalizedCity.includes('noida') || normalizedCity.includes('sector 62')) {
        return {
          success: true,
          station: {
            id: 'ps_noida',
            name: 'Sector 58 Police Station',
            address: 'Sector 58, Noida, Uttar Pradesh 201301',
            phone: '0120-XXXXXXX',
            latitude: 28.5980,
            longitude: 77.3680,
          },
          distanceKm: '0.00',
          mapsUrl: 'https://www.google.com/maps/search/?api=1&query=28.5980,77.3680',
        };
      } else if (normalizedCity.includes('varanasi')) {
        return {
          success: true,
          station: {
            id: 'ps_varanasi',
            name: 'Cantonment Police Station',
            address: 'Cantonment, Varanasi, Uttar Pradesh 221002',
            phone: '0542-XXXXXXX',
            latitude: 25.3280,
            longitude: 82.9900,
          },
          distanceKm: '0.00',
          mapsUrl: 'https://www.google.com/maps/search/?api=1&query=25.3280,82.9900',
        };
      } else if (normalizedCity.includes('ghaziabad') || normalizedCity.includes('indirapuram')) {
        return {
          success: true,
          station: {
            id: 'ps_ghaziabad',
            name: 'Indirapuram Police Station',
            address: 'Indirapuram, Ghaziabad, Uttar Pradesh 201014',
            phone: '0120-YYYYYYY',
            latitude: 28.6360,
            longitude: 77.3710,
          },
          distanceKm: '0.00',
          mapsUrl: 'https://www.google.com/maps/search/?api=1&query=28.6360,77.3710',
        };
      } else if (normalizedCity.includes('prayagraj') || normalizedCity.includes('civil lines')) {
        return {
          success: true,
          station: {
            id: 'ps_prayagraj',
            name: 'Civil Lines Police Station',
            address: 'Civil Lines, Prayagraj, Uttar Pradesh 211001',
            phone: '0532-ZZZZZZZ',
            latitude: 25.4510,
            longitude: 81.8410,
          },
          distanceKm: '0.00',
          mapsUrl: 'https://www.google.com/maps/search/?api=1&query=25.4510,81.8410',
        };
      }
    }

    if (matched.length === 0) {
      this.logger.warn(`No police station match found for normalized city: "${normalizedCity}"`);
      return {
        success: false,
        station: null as any,
        distanceKm: '0.00',
        mapsUrl: '',
      };
    }

    const station = matched[0];
    return {
      success: true,
      station,
      distanceKm: '0.00',
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`,
    };
  }

  findNearest(lat: number, lng: number): { success: boolean; station: PoliceStation; distanceKm: string; mapsUrl: string; demoMode?: boolean } {
    if (!this.stations || this.stations.length === 0) {
      this.logger.warn('Empty police station database. Triggering Demo Mode fallback mock station.');
      return {
        success: true,
        demoMode: true,
        station: {
          id: 'ps_mock_gomtinagar',
          name: 'Gomti Nagar Police Station',
          address: 'Gomti Nagar, Lucknow',
          phone: '0522-XXXXXXX',
          latitude: 26.8530,
          longitude: 81.0005,
        },
        distanceKm: '0.00',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=26.8530,81.0005',
      };
    }

    let nearest: PoliceStation = this.stations[0];
    let minDistance = Infinity;

    for (const station of this.stations) {
      const dist = this.calculateDistance(lat, lng, station.latitude, station.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = station;
      }
    }

    return {
      success: true,
      station: nearest,
      distanceKm: minDistance.toFixed(2),
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${nearest.latitude},${nearest.longitude}`,
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
