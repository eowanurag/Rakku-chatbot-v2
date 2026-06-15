import { env } from "../../config/env";
import { CONSTANTS } from "../../config/constants";

export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

const getBackendUrl = () => {
  if (typeof window === "undefined") {
    return env.NEXT_PUBLIC_BACKEND_URL;
  }
  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  return isLocalhost 
    ? "http://localhost:3001/api" 
    : env.NEXT_PUBLIC_BACKEND_URL;
};

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBackendUrl();
  const url = `${baseUrl}${path}`;

  // Read default headers
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Inject device location & language context if available on client window
  if (typeof window !== "undefined") {
    const locale = localStorage.getItem(CONSTANTS.STORAGE_KEYS.USER_LOCALE) || CONSTANTS.LOCALES.DEFAULT;
    defaultHeaders["X-Citizen-Language"] = locale;

    const sessionDataStr = localStorage.getItem(CONSTANTS.STORAGE_KEYS.SESSION_PROFILE);
    if (sessionDataStr) {
      try {
        const session = JSON.parse(sessionDataStr);
        if (session.location) {
          if (session.location.latitude) {
            defaultHeaders["X-Device-Location-Lat"] = String(session.location.latitude);
          }
          if (session.location.longitude) {
            defaultHeaders["X-Device-Location-Long"] = String(session.location.longitude);
          }
        }
      } catch (_) {
        // Silent catch for parsing errors
      }
    }
  }

  const mergedHeaders = {
    ...defaultHeaders,
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONSTANTS.API.TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      headers: mergedHeaders,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetails;
      try {
        errorDetails = await response.json();
      } catch (_) {
        errorDetails = await response.text();
      }
      throw new ApiError(
        `HTTP Error: ${response.statusText}`,
        response.status,
        errorDetails
      );
    }

    return (await response.json()) as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new ApiError("Request timeout exceeded", 408);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    // Generic connection error (e.g. offline)
    throw new ApiError(err.message || "Network request failed", 500);
  }
}
