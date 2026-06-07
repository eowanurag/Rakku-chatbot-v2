import { Injectable } from '@nestjs/common';

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

  findNearest(lat: number, lng: number): { station: PoliceStation; distanceKm: string; mapsUrl: string } {
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
