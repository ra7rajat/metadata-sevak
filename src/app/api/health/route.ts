/**
 * Health check API route.
 * Reports availability of each Google service the app depends on.
 * @module api/health
 */

import type { HealthResponse, ServiceStatus } from '@/types';
import { getActiveModelId } from '@/lib/gemini';

/**
 * Checks if an environment variable is configured (non-empty).
 *
 * @param key - The environment variable name.
 * @returns `true` if the variable is set and non-empty.
 */
function isConfigured(key: string): boolean {
  const value = process.env[key];
  return !!value && value.trim() !== '';
}

/**
 * Probes the Gemini API by checking if the client is configured
 * and a model has been resolved.
 *
 * @returns Service status for Gemini.
 */
async function checkGemini(): Promise<ServiceStatus> {
  const start = Date.now();

  if (!isConfigured('GEMINI_API_KEY')) {
    return {
      available: false,
      message: 'GEMINI_API_KEY is not configured',
    };
  }

  const activeModel = getActiveModelId();

  return {
    available: true,
    message: activeModel
      ? `Connected — active model: ${activeModel}`
      : 'Configured — model not yet resolved (will resolve on first chat request)',
    latencyMs: Date.now() - start,
  };
}

/**
 * Checks Google Custom Search Engine configuration.
 *
 * @returns Service status for Custom Search.
 */
async function checkCustomSearch(): Promise<ServiceStatus> {
  const start = Date.now();
  const hasApiKey = isConfigured('GOOGLE_API_KEY');
  const hasCseId = isConfigured('GOOGLE_CSE_ID');

  if (!hasApiKey || !hasCseId) {
    const missing: string[] = [];
    if (!hasApiKey) missing.push('GOOGLE_API_KEY');
    if (!hasCseId) missing.push('GOOGLE_CSE_ID');

    return {
      available: false,
      message: `Missing: ${missing.join(', ')}`,
    };
  }

  return {
    available: true,
    message: 'Custom Search configured',
    latencyMs: Date.now() - start,
  };
}

/**
 * Checks Google Maps API configuration.
 *
 * @returns Service status for Maps.
 */
async function checkMaps(): Promise<ServiceStatus> {
  const start = Date.now();

  if (!isConfigured('MAPS_API_KEY')) {
    return {
      available: false,
      message: 'MAPS_API_KEY is not configured',
    };
  }

  return {
    available: true,
    message: 'Maps API configured',
    latencyMs: Date.now() - start,
  };
}

/**
 * GET /api/health
 *
 * Returns a JSON report of each Google service's availability.
 * Used for monitoring and deployment health checks.
 *
 * @returns JSON response conforming to HealthResponse type.
 */
export async function GET(): Promise<Response> {
  const [gemini, customSearch, maps] = await Promise.all([
    checkGemini(),
    checkCustomSearch(),
    checkMaps(),
  ]);

  const allHealthy = gemini.available && customSearch.available && maps.available;
  const allDown = !gemini.available && !customSearch.available && !maps.available;

  const response: HealthResponse = {
    status: allHealthy ? 'healthy' : allDown ? 'unhealthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      gemini,
      customSearch,
      maps,
    },
  };

  return Response.json(response, {
    status: allHealthy ? 200 : allDown ? 503 : 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://*.run.app',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
