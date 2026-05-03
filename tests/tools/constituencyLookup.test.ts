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
});
