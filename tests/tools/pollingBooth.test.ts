/**
 * Tests for Polling Booth utility
 * @module tests/tools/pollingBooth
 */

jest.mock('@/config/validateEnv', () => ({
  getEnvVar: jest.fn(() => 'test-maps-api-key'),
}));

jest.mock('node-cache', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
  }));
});

const mockFetch = jest.fn();

global.fetch = mockFetch;

describe('pollingBooth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findPollingBooth', () => {
    const { findPollingBooth } = require('@/tools/pollingBooth');

    it('returns error for invalid EPIC format - too short', async () => {
      const result = await findPollingBooth('ABC12');
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_INPUT');
      expect(result.error).toContain('Invalid EPIC');
    });

    it('returns error for invalid EPIC format - missing digits', async () => {
      const result = await findPollingBooth('ABCD');
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_INPUT');
    });

    it('returns error for invalid EPIC format - contains special chars', async () => {
      const result = await findPollingBooth('ABC!@#$67');
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_INPUT');
    });

    it('returns error for invalid EPIC format - has 8 digits instead of 7', async () => {
      const result = await findPollingBooth('ABC12345678');
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_INPUT');
    });

    it('returns error when ECI returns 429 rate limit', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 429,
        ok: false,
      });
      
      const result = await findPollingBooth('ABC1234567');
      expect(result.success).toBe(false);
      expect(result.code).toBe('RATE_LIMITED');
    });

    it('returns NOT_FOUND when no record found', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: [] }),
      });
      
      const result = await findPollingBooth('ABC1234567');
      expect(result.success).toBe(false);
      expect(result.code).toBe('NOT_FOUND');
    });

    it('returns booth info when valid EPIC found', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          data: [{
            ps_no: '001',
            ps_name: 'Primary School',
            ac_name: 'Andheri',
            district: 'Mumbai',
            state: 'Maharashtra',
          }],
        }),
      });
      
      const result = await findPollingBooth('ABC1234567');
      expect(result.success).toBe(true);
      expect(result.booth).toBeDefined();
      expect(result.booth?.boothNumber).toBe('001');
      expect(result.booth?.constituency).toBe('Andheri');
    });

    it('handles network timeout error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('aborted'));
      
      const result = await findPollingBooth('ABC1234567');
      expect(result.success).toBe(false);
      expect(result.code).toBe('NETWORK_ERROR');
    });

    it('handles network generic error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('connection refused'));
      
      const result = await findPollingBooth('ABC1234567');
      expect(result.success).toBe(false);
      expect(result.code).toBe('NETWORK_ERROR');
    });

    it('normalizes EPIC to uppercase', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: [] }),
      });
      
      await findPollingBooth('abc1234567');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ epic_no: 'ABC1234567' }),
        })
      );
    });
  });

  describe('getBoothMapUrl', () => {
    it('returns empty string when address is empty', () => {
      const { getBoothMapUrl } = require('@/tools/pollingBooth');
      expect(getBoothMapUrl('')).toBe('');
    });

    it('returns empty string when address is undefined', () => {
      const { getBoothMapUrl } = require('@/tools/pollingBooth');
      expect(getBoothMapUrl(undefined as any)).toBe('');
    });

    it('returns valid map URL for valid address', () => {
      const { getBoothMapUrl } = require('@/tools/pollingBooth');
      const url = getBoothMapUrl('123 Main Street, Mumbai');
      
      expect(url).toContain('maps.googleapis.com/maps/api/staticmap');
      expect(url).toContain('center=');
      expect(url).toContain('zoom=16');
      expect(url).toContain('size=600x400');
      expect(url).toContain('markers=');
      expect(url).toContain('key=');
    });

    it('encodes special characters in address', () => {
      const { getBoothMapUrl } = require('@/tools/pollingBooth');
      const url = getBoothMapUrl('测试地址, Mumbai');
      expect(url).not.toContain('测试地址');
    });
  });

  describe('getBoothDirectionsUrl', () => {
    it('returns empty string when address is empty', () => {
      const { getBoothDirectionsUrl } = require('@/tools/pollingBooth');
      expect(getBoothDirectionsUrl('')).toBe('');
    });

    it('returns empty string when address is undefined', () => {
      const { getBoothDirectionsUrl } = require('@/tools/pollingBooth');
      expect(getBoothDirectionsUrl(undefined as any)).toBe('');
    });

    it('returns valid directions URL for valid address', () => {
      const { getBoothDirectionsUrl } = require('@/tools/pollingBooth');
      const url = getBoothDirectionsUrl('123 Main Street, Mumbai');
      
      expect(url).toContain('google.com/maps/dir/');
      expect(url).toContain('destination=');
    });

    it('encodes special characters in address', () => {
      const { getBoothDirectionsUrl } = require('@/tools/pollingBooth');
      const url = getBoothDirectionsUrl('测试地址, Mumbai');
      expect(url).not.toContain('测试地址');
    });
  });
});