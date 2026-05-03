import { NextRequest } from 'next/server';
import { getEnvVar } from '@/config/validateEnv';
import {
  findPollingBooth,
  getBoothDirectionsUrl,
  pincodeToConstituency,
} from '@/tools';

/**
 * Generates a Google Maps embed URL for the given address.
 * Uses the Maps Embed API with the configured API key.
 * @param address - The address to embed on the map.
 * @returns Embed URL string or empty if no API key.
 */
function getMapEmbedUrl(address: string): string {
  const apiKey = getEnvVar('MAPS_API_KEY');
  if (!apiKey || !address) return '';
  return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(address)}`;
}

/**
 * Booth Finder API - Locates polling booth by EPIC or pincode.
 * 
 * Query params:
 * - epic: EPIC number (e.g., ABC1234567)
 * - pincode: 6-digit postal code
 * 
 * Returns booth location with Google Maps embed and directions.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const params = request.nextUrl.searchParams;
  const epic = params.get('epic') || '';
  const pincode = params.get('pincode') || '';

  if (epic) {
    const booth = await findPollingBooth(epic);
    if (!booth.success) {
      return Response.json(booth);
    }

    return Response.json({
      ...booth,
      embedUrl: getMapEmbedUrl(booth.booth.address),
      directionsUrl: getBoothDirectionsUrl(booth.booth.address),
    });
  }

  if (!pincode) {
    return Response.json(
      { success: false, error: 'Pincode or EPIC is required.', code: 'INVALID_INPUT' },
      { status: 400 }
    );
  }

  const constituency = await pincodeToConstituency(pincode);
  return Response.json(constituency);
}
