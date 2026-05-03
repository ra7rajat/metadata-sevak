/**
 * API and health check types.
 * @module types/api
 */

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    gemini: ServiceStatus;
    customSearch: ServiceStatus;
    maps: ServiceStatus;
  };
}

export interface ServiceStatus {
  available: boolean;
  message: string;
  latencyMs?: number;
}

export type RequiredEnvKey =
  | 'GEMINI_API_KEY'
  | 'GOOGLE_API_KEY'
  | 'GOOGLE_CSE_ID'
  | 'MAPS_API_KEY';

export interface RateLimitEntry {
  count: number;
  windowStart: number;
}

export const GEMINI_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemma-4-26b',
  'gemma-4-31b',
] as const;

export type GeminiModelId = (typeof GEMINI_MODELS)[number];