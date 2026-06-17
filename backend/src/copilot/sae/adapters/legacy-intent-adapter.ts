import { Injectable } from '@nestjs/common';

@Injectable()
export class LegacyIntentAdapter {
  private static readonly MAPPING: Record<string, string[]> = {
    LOST_MOBILE: ["LOSS", "MOBILE"],
    LOST_AADHAAR: ["LOSS", "DOCUMENT", "AADHAAR"],
    LOST_PROPERTY: ["LOSS", "PROPERTY"],
    PROPERTY_THEFT: ["THEFT", "PROPERTY"],
    VEHICLE_THEFT: ["THEFT", "VEHICLE"],
    UPI_FRAUD: ["FRAUD", "PAYMENT"],
    CYBER_FRAUD: ["FRAUD", "PAYMENT"],
    TENANT_VERIFICATION: ["VERIFICATION", "TENANT"],
    CHARACTER_CERTIFICATE: ["CERTIFICATE", "CHARACTER"],
    EVENT_PERMISSION: ["PERMISSION", "EVENT"],
    APPLICATION_TRACKING: ["TRACKING", "APPLICATION"]
  };

  public adapt(intent: string): string[] {
    const canonical = intent.toUpperCase().trim();
    return LegacyIntentAdapter.MAPPING[canonical] || ["GENERAL"];
  }

  public getAllLegacyIntents(): string[] {
    return Object.keys(LegacyIntentAdapter.MAPPING);
  }
}
