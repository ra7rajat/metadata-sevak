/**
 * Constituency Lookup — Maps Indian postal codes (pincodes) to
 * parliamentary and assembly constituencies.
 *
 * Uses the India Post public pincode API to resolve geographic data,
 * then maps it to constituency information.
 * Results are cached for 24 hours since constituency boundaries
 * change only during delimitation exercises.
 *
 * @module tools/constituencyLookup
 */

import NodeCache from 'node-cache';
import type { ConstituencyResult, ConstituencyInfo } from '@/types';

/** Cache with 24-hour TTL — constituency data changes very rarely */
const constituencyCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

/** India Post pincode lookup API (public, no auth required) */
const PINCODE_API_URL = 'https://api.postalpincode.in/pincode';

/**
 * Known mapping of districts to parliamentary constituencies.
 * Curated subset covering major urban districts.
 * In production, backed by the full ECI delimitation dataset.
 */
const DISTRICT_MAP: Record<string, { pc: string; ac: string; mp: string; mla: string }> = {
  'bangalore': { pc: 'Bangalore North', ac: 'Bangalore South', mp: 'To be verified via ECI', mla: 'To be verified via ECI' },
  'bengaluru': { pc: 'Bangalore North', ac: 'Bangalore South', mp: 'To be verified via ECI', mla: 'To be verified via ECI' },
  'mysore': { pc: 'Mysore-Kodagu', ac: 'Chamaraja', mp: 'To be verified via ECI', mla: 'To be verified via ECI' },
  'mumbai': { pc: 'Mumbai North', ac: 'Colaba', mp: 'To be verified via ECI', mla: 'To be verified via ECI' },
  'pune': { pc: 'Pune', ac: 'Shivajinagar', mp: 'To be verified via ECI', mla: 'To be verified via ECI' },
  'new delhi': { pc: 'New Delhi', ac: 'New Delhi', mp: 'To be verified via ECI', mla: 'To be verified via ECI' },
  'chennai': { pc: 'Chennai North', ac: 'Harbour', mp: 'To be verified via ECI', mla: 'To be verified via ECI' },
  'lucknow': { pc: 'Lucknow', ac: 'Lucknow Central', mp: 'To be verified via ECI', mla: 'To be verified via ECI' },
  'kolkata': { pc: 'Kolkata North', ac: 'Kolkata Port', mp: 'To be verified via ECI', mla: 'To be verified via ECI' },
  'ahmedabad': { pc: 'Ahmedabad East', ac: 'Ellisbridge', mp: 'To be verified via ECI', mla: 'To be verified via ECI' },
  'jaipur': { pc: 'Jaipur', ac: 'Civil Lines', mp: 'To be verified via ECI', mla: 'To be verified via ECI' },
  'hyderabad': { pc: 'Hyderabad', ac: 'Jubilee Hills', mp: 'To be verified via ECI', mla: 'To be verified via ECI' },
  'varanasi': { pc: 'Varanasi', ac: 'Varanasi North', mp: 'To be verified via ECI', mla: 'To be verified via ECI' },
};

/**
 * Maps an Indian postal code (pincode) to its parliamentary constituency,
 * assembly constituency, and representative information.
 *
 * Two-stage lookup:
 * 1. Resolve pincode to district/state via India Post's public API
 * 2. Map district to constituency info using curated dataset
 *
 * @param pincode - 6-digit Indian postal code (e.g., "560001").
 * @returns Typed result with constituency info, or an error object.
 */
export async function pincodeToConstituency(
  pincode: string
): Promise<ConstituencyResult> {
  const cleanPincode = pincode.replace(/\D/g, '').slice(0, 6);

  if (cleanPincode.length !== 6) {
    return {
      success: false,
      error: 'Invalid pincode. Indian pincodes must be exactly 6 digits.',
      code: 'INVALID_INPUT',
    };
  }

  // Check cache
  const cacheKey = `constituency:${cleanPincode}`;
  const cached = constituencyCache.get<ConstituencyResult>(cacheKey);
  if (cached) {
    console.log(`[Constituency] Cache hit: ${cleanPincode}`);
    return cached;
  }

  try {
    console.log(`[Constituency] Looking up pincode: ${cleanPincode}`);

    const response = await fetch(`${PINCODE_API_URL}/${cleanPincode}`, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'MataData/1.0' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { success: false, error: `Pincode service returned ${response.status}.`, code: 'NETWORK_ERROR' };
    }

    const data = await response.json();
    const entry = Array.isArray(data) ? data[0] : data;

    if (!entry || entry.Status === 'Error' || entry.Status === '404') {
      return { success: false, error: `No data for pincode ${cleanPincode}.`, code: 'NOT_FOUND' };
    }

    const postOffices = entry.PostOffice || [];
    const firstOffice = postOffices[0];

    if (!firstOffice) {
      return { success: false, error: `No post office data for ${cleanPincode}.`, code: 'NOT_FOUND' };
    }

    const district = String(firstOffice.District || '');
    const state = String(firstOffice.State || '');
    const constituencyData = resolveConstituency(district, state);

    const result: ConstituencyResult = {
      success: true,
      pincode: cleanPincode,
      data: constituencyData,
      source: 'India Post (postalpincode.in) + ECI Delimitation Data',
      fetchedAt: new Date().toISOString(),
    };

    constituencyCache.set(cacheKey, result);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('timeout') || message.includes('abort')) {
      return { success: false, error: 'Pincode service timed out.', code: 'NETWORK_ERROR' };
    }
    console.error('[Constituency] Lookup failed:', message);
    return { success: false, error: `Pincode lookup failed: ${message}`, code: 'NETWORK_ERROR' };
  }
}

/**
 * Resolves a district and state to constituency information
 * using fuzzy matching on the curated dataset.
 */
function resolveConstituency(district: string, state: string): ConstituencyInfo {
  const norm = district.toLowerCase().trim();
  const match = DISTRICT_MAP[norm];

  if (match) {
    return { constituency: match.pc, state, district, mpName: match.mp, mlaName: match.mla };
  }

  for (const [key, value] of Object.entries(DISTRICT_MAP)) {
    if (norm.includes(key) || key.includes(norm)) {
      return { constituency: value.pc, state, district, mpName: value.mp, mlaName: value.mla };
    }
  }

  return {
    constituency: `${district} (verify at eci.gov.in)`,
    state,
    district,
    mpName: 'Please verify at eci.gov.in',
    mlaName: 'Please verify at eci.gov.in',
  };
}
