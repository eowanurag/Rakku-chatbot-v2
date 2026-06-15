export interface ApiErrorResponse {
  message: string;
  statusCode: number;
  error?: string;
}

export interface LocalizedMessage {
  messageKey: string;
  params?: Record<string, string>;
}

export interface GeolocationContext {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export interface RequestMeta {
  language: string;
  location?: GeolocationContext;
}
