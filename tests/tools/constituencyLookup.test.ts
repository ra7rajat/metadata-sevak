/**
 * Tests for constituencyLookup tool.
 * Covers happy path, error handling, edge cases.
 * @module tests/tools/constituencyLookup
 */

import { pincodeToConstituency } from '@/tools/constituencyLookup';

global.fetch = jest.fn();

describe('constituencyLookup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves valid pincode to constituency data', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          Status: 'Success',
          PostOffice: [{ District: 'Bangalore', State: 'Karnataka' }],
        },
      ],
    });

    const result = await pincodeToConstituency('560001');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.pincode).toBe('560001');
      expect(result.data.district).toBe('Bangalore');
      expect(result.data.constituency).toContain('Bangalore');
    }
  });

  it('rejects invalid pincode format', async () => {
    const result = await pincodeToConstituency('123'); // too short
    expect(result.success).toBe(false);
    
    const resultAlnum = await pincodeToConstituency('123A56');
    expect(resultAlnum.success).toBe(false);
  });

  it('handles API failure gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const result = await pincodeToConstituency('560002');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('NETWORK_ERROR');
    }
  });

  it('handles empty post office array', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ Status: 'Success', PostOffice: [] }],
    });

    const result = await pincodeToConstituency('560003');
    expect(result.success).toBe(false);
  });

  it('handles non-JSON response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    const result = await pincodeToConstituency('560004');
    expect(result.success).toBe(false);
  });

  it('handles network timeout', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('The operation was aborted.'));

    const result = await pincodeToConstituency('560005');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.error).toContain('timed out');
    }
  });

  it('handles Status: Error from API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ Status: 'Error' }],
    });

    const result = await pincodeToConstituency('560006');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('NOT_FOUND');
    }
  });

  it('handles missing district in post office', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { Status: 'Success', PostOffice: [{ State: 'Karnataka' }] },
      ],
    });

    const result = await pincodeToConstituency('560007');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.district).toBe('');
    }
  });

  it('resolves to fallback for unknown district', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { Status: 'Success', PostOffice: [{ District: 'UnknownDistrict', State: 'UnknownState' }] },
      ],
    });

    const result = await pincodeToConstituency('560008');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.constituency).toContain('eci.gov.in');
    }
  });
});
