import { NextRequest } from 'next/server';
import { getEnvVar } from '@/config/validateEnv';
import {
  findPollingBooth,
  getBoothDirectionsUrl,
  pincodeToConstituency,
} from '@/tools';

function getMapEmbedUrl(address: string): string {
  const apiKey = getEnvVar('MAPS_API_KEY');
  if (!apiKey || !address) return '';
  return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(address)}`;
}

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
