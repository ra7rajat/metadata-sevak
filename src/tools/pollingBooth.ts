/**
 * Polling Booth Finder — Locates a voter's assigned polling booth
 * using their EPIC (voter ID) number, and generates Google Maps
 * URLs for navigation.
 *
 * Uses ECI's voter search API to find booth details, then leverages
 * Google Maps Static API (for map images) and Google Maps URLs
 * (for directions). MAPS_API_KEY is read from process.env.
 *
 * @module tools/pollingBooth
 */

/**
 * GOOGLE SERVICE: Google Maps Platform (Static API & Maps URLs)
 * PURPOSE: Provides visual orientation (static map image) and actionable routing (directions URL) for voters to easily locate their assigned polling booths.
 * ALTERNATIVES CONSIDERED: Text-only addresses (often ambiguous in rural/dense urban India, leading to voter drop-off).
 * API DOCS: https://developers.google.com/maps/documentation
 */

import NodeCache from 'node-cache';
import { getEnvVar } from '@/config/validateEnv';
import type { PollingBoothResult, PollingBoothInfo } from '@/types';

/** Cache with 1-hour TTL for booth data */
const boothCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

/** ECI voter search by EPIC number endpoint */
const ECI_EPIC_SEARCH_URL = 'https://gateway-voters.eci.gov.in/api/v1/elastic/search-by-epic';

/**
 * Finds the assigned polling booth for a voter by their EPIC number.
 *
 * Queries ECI's voter services API with the EPIC (voter ID) number,
 * extracts booth details, and enriches the result with Google Maps
 * URLs for navigation. Results are cached for 1 hour.
 *
 * @param epicNumber - The voter's EPIC (Electoral Photo ID Card) number.
 *                     Format: 3 letters + 7 digits (e.g., "ABC1234567").
 * @returns Typed result with booth info including map/directions URLs.
 */
export async function findPollingBooth(
  epicNumber: string
): Promise<PollingBoothResult> {
  const cleanEpic = epicNumber.trim().toUpperCase();

  // Validate EPIC format: 3 letters + 7 digits
  if (!/^[A-Z]{3}\d{7}$/.test(cleanEpic)) {
    return {
      success: false,
      error: 'Invalid EPIC number. Format must be 3 letters followed by 7 digits (e.g., ABC1234567).',
      code: 'INVALID_INPUT',
    };
  }

  // Check cache
  const cacheKey = `booth:${cleanEpic}`;
  const cached = boothCache.get<PollingBoothResult>(cacheKey);
  if (cached) {
    console.log(`[PollingBooth] Cache hit: ${cleanEpic}`);
    return cached;
  }

  try {
    console.log(`[PollingBooth] Searching for EPIC: ${cleanEpic}`);

    const response = await fetch(ECI_EPIC_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'MataData-ElectionAssistant/1.0',
      },
      body: JSON.stringify({ epic_no: cleanEpic }),
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 429) {
      return { success: false, error: 'ECI rate limit reached. Try again later.', code: 'RATE_LIMITED' };
    }

    if (!response.ok) {
      console.warn(`[PollingBooth] ECI API status ${response.status}`);
    }

    let booth: PollingBoothInfo | null = null;

    try {
      const data = await response.json();
      const record = Array.isArray(data?.data) ? data.data[0] : data?.data;

      if (record) {
        const address = buildAddress(record);
        booth = {
          boothNumber: String(record.ps_no || record.part_no || ''),
          boothName: String(record.ps_name || record.polling_station || ''),
          address,
          constituency: String(record.ac_name || record.constituency || ''),
          district: String(record.district || record.dist_name || ''),
          state: String(record.state || record.st_name || ''),
          mapImageUrl: getBoothMapUrl(address),
          directionsUrl: getBoothDirectionsUrl(address),
        };
      }
    } catch {
      console.warn('[PollingBooth] Non-JSON response from ECI');
    }

    if (!booth) {
      return {
        success: false,
        error: `No polling booth found for EPIC number ${cleanEpic}. Please verify your voter ID.`,
        code: 'NOT_FOUND',
      };
    }

    const result: PollingBoothResult = {
      success: true,
      epicNumber: cleanEpic,
      booth,
      source: 'Election Commission of India (eci.gov.in)',
      fetchedAt: new Date().toISOString(),
    };

    boothCache.set(cacheKey, result);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('timeout') || message.includes('abort')) {
      return { success: false, error: 'ECI service timed out.', code: 'NETWORK_ERROR' };
    }
    console.error('[PollingBooth] Search failed:', message);
    return { success: false, error: `Booth search failed: ${message}`, code: 'NETWORK_ERROR' };
  }
}

/**
 * Generates a Google Maps Static API URL that renders a map image
 * centered on the given booth address.
 *
 * Uses MAPS_API_KEY from process.env. Returns a signed URL
 * with a marker at the booth location, zoom level 16, 600x400px.
 *
 * @param boothAddress - Full address of the polling booth.
 * @returns Google Maps Static API URL string, or empty string if no API key.
 */
export function getBoothMapUrl(boothAddress: string): string {
  const apiKey = getEnvVar('MAPS_API_KEY');
  if (!apiKey || !boothAddress) return '';

  const encodedAddress = encodeURIComponent(boothAddress);

  return (
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?center=${encodedAddress}` +
    `&zoom=16` +
    `&size=600x400` +
    `&scale=2` +
    `&maptype=roadmap` +
    `&markers=color:red%7Clabel:P%7C${encodedAddress}` +
    `&key=${apiKey}`
  );
}

/**
 * Generates a Google Maps directions URL for navigating to
 * the polling booth address. Opens in the user's default maps app.
 *
 * @param boothAddress - Full address of the polling booth.
 * @returns Google Maps directions URL string.
 */
export function getBoothDirectionsUrl(boothAddress: string): string {
  if (!boothAddress) return '';
  const encodedAddress = encodeURIComponent(boothAddress);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
}

/**
 * Builds a human-readable address string from an ECI record.
 */
function buildAddress(record: Record<string, unknown>): string {
  const parts = [
    record.ps_name || record.polling_station,
    record.locality,
    record.district || record.dist_name,
    record.state || record.st_name,
  ].filter(Boolean).map(String);

  return parts.join(', ') || 'Address not available';
}
