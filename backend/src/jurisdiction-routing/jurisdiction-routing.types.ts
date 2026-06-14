export enum RoutingTargetType {
  POLICE_STATION = 'POLICE_STATION',
  CYBER_CELL = 'CYBER_CELL',
  VERIFICATION_UNIT = 'VERIFICATION_UNIT',
  OTHER = 'OTHER',
}

export enum ResolutionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  OVERRIDDEN = 'OVERRIDDEN',
  EXPIRED = 'EXPIRED',
}

export enum ResolutionEventType {
  RESOLUTION_CREATED = 'RESOLUTION_CREATED',
  AUTO_ASSIGNED = 'AUTO_ASSIGNED',
  USER_CONFIRMED = 'USER_CONFIRMED',
  USER_SELECTED = 'USER_SELECTED',
  FALLBACK_ASSIGNED = 'FALLBACK_ASSIGNED',
  OVERRIDDEN = 'OVERRIDDEN',
  EXPIRED = 'EXPIRED',
}

export enum RoutingDecision {
  AUTO_ASSIGNED = 'AUTO_ASSIGNED',
  USER_CONFIRMED = 'USER_CONFIRMED',
  USER_SELECTED = 'USER_SELECTED',
  FALLBACK_ASSIGNED = 'FALLBACK_ASSIGNED',
}

export enum MatchType {
  EXACT = 'EXACT',
  ALIAS = 'ALIAS',
  FUZZY = 'FUZZY',
  MULTIPLE = 'MULTIPLE',
  NONE = 'NONE',
}

export enum ResolutionSource {
  GPS = 'GPS',
  TEXT_INPUT = 'TEXT_INPUT',
  PROFILE_ADDRESS = 'PROFILE_ADDRESS',
  EVENT_LOCATION = 'EVENT_LOCATION',
  PROPERTY_ADDRESS = 'PROPERTY_ADDRESS',
  MANUAL_SELECTION = 'MANUAL_SELECTION',
}

export enum ActorType {
  CITIZEN = 'CITIZEN',
  OFFICER = 'OFFICER',
  SYSTEM = 'SYSTEM',
  ADMIN = 'ADMIN',
  FASTAPI = 'FASTAPI',
  NESTJS = 'NESTJS',
}

export enum RoutingContext {
  INCIDENT_LOCATION = 'INCIDENT_LOCATION',
  APPLICANT_ADDRESS = 'APPLICANT_ADDRESS',
  PROPERTY_ADDRESS = 'PROPERTY_ADDRESS',
  EVENT_LOCATION = 'EVENT_LOCATION',
  WORKPLACE_ADDRESS = 'WORKPLACE_ADDRESS',
  OTHER = 'OTHER',
}

export interface LocationResolutionInput {
  serviceType: string;
  routingContext: RoutingContext;
  location: string;
  resolutionSource: ResolutionSource;
  coordinates?: { lat: number; lng: number };
  citizenId?: string;
}

export interface LocationResolutionResult {
  districtCode: string;
  cityCode?: string;
  localityCode?: string;
  confidence: number;
  matchType: MatchType;
  resolvedStationId?: string;
  registryVersion: string;
}
