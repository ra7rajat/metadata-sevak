/**
 * Tests for tools - edge cases and error handling
 * @module tests/tools/edgeCases
 */

// Mock environment
process.env.GEMINI_API_KEY = 'test-key';
process.env.GOOGLE_API_KEY = 'test-key';
process.env.GOOGLE_CSE_ID = 'test-id';
process.env.MAPS_API_KEY = 'test-key';

import { findPollingBooth, getBoothDirectionsUrl, getBoothMapUrl, pincodeToConstituency } from '@/tools';
import { checkClaim } from '@/tools/factChecker';

describe('Tools Edge Cases', () => {
  describe('findPollingBooth', () => {
    it('should return error for invalid EPIC format', async () => {
      const result = await findPollingBooth('INVALID');
      if (!result.success) {
        expect(result.error).toContain('Invalid EPIC');
      }
    });

    it('should return error for empty EPIC', async () => {
      const result = await findPollingBooth('');
      expect(result.success).toBe(false);
    });
  });

  describe('getBoothDirectionsUrl', () => {
    it('should return empty string for empty address', () => {
      const url = getBoothDirectionsUrl('');
      expect(url).toBe('');
    });

    it('should return directions URL for valid address', () => {
      const url = getBoothDirectionsUrl('123 Main St, Bangalore');
      expect(url).toContain('google.com/maps/dir');
      expect(url).toContain('123%20Main%20St');
    });
  });

  describe('getBoothMapUrl', () => {
    it('should return empty string for empty address', () => {
      const url = getBoothMapUrl('');
      expect(url).toBe('');
    });

    it('should return map URL for valid address', () => {
      const url = getBoothMapUrl('123 Main St, Bangalore');
      expect(url).toContain('maps.googleapis.com/maps/api/staticmap');
      expect(url).toContain('123%20Main%20St');
    });
  });

  describe('pincodeToConstituency', () => {
    it('should return error for invalid pincode', async () => {
      const result = await pincodeToConstituency('12345');
      expect(result.success).toBe(false);
    });

    it('should return error for empty pincode', async () => {
      const result = await pincodeToConstituency('');
      expect(result.success).toBe(false);
    });
  });

  describe('checkClaim', () => {
    it('should return error for empty claim', async () => {
      const result = await checkClaim('');
      if (!result.success) {
        expect(result.error).toContain('at least 5 characters');
      }
    });

    it('should return error for short claim', async () => {
      const result = await checkClaim('abc');
      expect(result.success).toBe(false);
    });

    it('should return error for whitespace-only claim', async () => {
      const result = await checkClaim('   ');
      expect(result.success).toBe(false);
    });
  });
});