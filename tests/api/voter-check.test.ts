/**
 * Tests for voter check API route.
 * @module tests/api/voter-check
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/voter-check/route';

jest.mock('@/tools', () => ({
  searchVoterRoll: jest.fn(),
  findPollingBooth: jest.fn(),
}));

import { searchVoterRoll, findPollingBooth } from '@/tools';

describe('/api/voter-check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('searches by EPIC when epic method is requested', async () => {
    (findPollingBooth as jest.Mock).mockResolvedValueOnce({
      success: true,
      epicNumber: 'ABC1234567',
      booth: { boothNumber: '12', address: 'Test Address' },
      source: 'ECI',
      fetchedAt: '2025-01-01T00:00:00.000Z',
    });

    const request = new NextRequest('http://localhost:3000/api/voter-check?method=epic&epic=ABC1234567');
    const response = await GET(request);
    const data = await response.json();

    expect(findPollingBooth).toHaveBeenCalledWith('ABC1234567');
    expect(data.success).toBe(true);
    expect(data.epicNumber).toBe('ABC1234567');
  });

  it('searches by voter details and enriches first result with booth data', async () => {
    (searchVoterRoll as jest.Mock).mockResolvedValueOnce({
      success: true,
      totalResults: 1,
      records: [
        {
          name: 'Rahul Kumar',
          constituency: 'Lucknow',
          epicNumber: 'ABC1234567',
        },
      ],
      source: 'ECI',
      fetchedAt: '2025-01-01T00:00:00.000Z',
    });
    (findPollingBooth as jest.Mock).mockResolvedValueOnce({
      success: true,
      epicNumber: 'ABC1234567',
      booth: { boothNumber: '15', address: 'Booth Street' },
      source: 'ECI',
      fetchedAt: '2025-01-01T00:00:00.000Z',
    });

    const request = new NextRequest('http://localhost:3000/api/voter-check?method=details&name=Rahul&state=Uttar%20Pradesh&district=Lucknow');
    const response = await GET(request);
    const data = await response.json();

    expect(searchVoterRoll).toHaveBeenCalledWith('Rahul', 'Uttar Pradesh', 'Lucknow');
    expect(findPollingBooth).toHaveBeenCalledWith('ABC1234567');
    expect(data.booth.success).toBe(true);
  });
});
