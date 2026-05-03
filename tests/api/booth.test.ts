/**
 * Tests for booth API route.
 * @module tests/api/booth
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/booth/route';

jest.mock('@/tools', () => ({
  findPollingBooth: jest.fn(),
  getBoothDirectionsUrl: jest.fn(),
  pincodeToConstituency: jest.fn(),
}));

import {
  findPollingBooth,
  getBoothDirectionsUrl,
  pincodeToConstituency,
} from '@/tools';

describe('/api/booth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MAPS_API_KEY = 'maps-key';
  });

  it('returns booth data and map links for epic lookup', async () => {
    (findPollingBooth as jest.Mock).mockResolvedValueOnce({
      success: true,
      epicNumber: 'ABC1234567',
      booth: {
        boothNumber: '12',
        boothName: 'Central School',
        address: 'Lucknow, Uttar Pradesh',
        constituency: 'Lucknow',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
      },
      source: 'ECI',
      fetchedAt: '2025-01-01T00:00:00.000Z',
    });
    (getBoothDirectionsUrl as jest.Mock).mockReturnValueOnce('https://maps.example/directions');

    const request = new NextRequest('http://localhost:3000/api/booth?epic=ABC1234567');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.embedUrl).toContain('maps/embed/v1/place');
    expect(data.directionsUrl).toBe('https://maps.example/directions');
  });

  it('falls back to constituency lookup for pincode searches', async () => {
    (pincodeToConstituency as jest.Mock).mockResolvedValueOnce({
      success: true,
      pincode: '226012',
      data: {
        constituency: 'Lucknow',
        state: 'Uttar Pradesh',
        district: 'Lucknow',
      },
      source: 'India Post',
      fetchedAt: '2025-01-01T00:00:00.000Z',
    });

    const request = new NextRequest('http://localhost:3000/api/booth?pincode=226012');
    const response = await GET(request);
    const data = await response.json();

    expect(pincodeToConstituency).toHaveBeenCalledWith('226012');
    expect(data.success).toBe(true);
    expect(data.data.constituency).toBe('Lucknow');
  });
});
