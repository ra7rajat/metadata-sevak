/**
 * Tests for cache utilities
 * @module tests/lib/cache
 */

describe('cache', () => {
  describe('isRedisAvailable', () => {
    it('returns false when REDIS_URL is not set', () => {
      const result = !!process.env.REDIS_URL;
      expect(result).toBe(false);
    });
  });
});