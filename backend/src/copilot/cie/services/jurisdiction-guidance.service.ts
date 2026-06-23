import { Injectable } from '@nestjs/common';

export interface JurisdictionGuidanceResult {
  expectedPoliceStation: string;
  onlineAvailability: boolean;
  routingExpectations: string;
}

@Injectable()
export class JurisdictionGuidanceService {
  public getGuidance(cityOrDistrict: string, serviceType: string): JurisdictionGuidanceResult {
    const isOnline = ['complaint', 'lost_mobile', 'cyber_fraud', 'tenant_verification'].includes((serviceType || '').toLowerCase());
    
    return {
      expectedPoliceStation: cityOrDistrict ? `Nearest station in ${cityOrDistrict}` : 'Nearest Local Police Station',
      onlineAvailability: isOnline,
      routingExpectations: isOnline 
        ? 'Your request will be routed online to the respective digital desk for direct processing.'
        : 'Your request requires physical routing to the local station officer.'
    };
  }
}
