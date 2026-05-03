/**
 * Tests for Fact Checker utility
 * @module tests/tools/factChecker
 */

jest.mock('@/lib/newsCache', () => ({
  getNewsCache: jest.fn(() => ({ get: jest.fn(), set: jest.fn() })),
  buildCacheKey: jest.fn(() => 'test-key'),
}));

jest.mock('@/config/validateEnv', () => ({
  getEnvVar: jest.fn(() => 'test-api-key'),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('factChecker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkClaim', () => {
    it('returns error for empty claim (less than 5 chars)', async () => {
      const { checkClaim } = require('@/tools/factChecker');
      const result = await checkClaim('');
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_INPUT');
    });

    it('returns error for short claim (less than 5 chars)', async () => {
      const { checkClaim } = require('@/tools/factChecker');
      const result = await checkClaim('abc');
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_INPUT');
    });

    it('returns error when API key is missing', async () => {
      (require('@/config/validateEnv') as any).getEnvVar.mockReturnValueOnce('');
      const { checkClaim } = require('@/tools/factChecker');
      const result = await checkClaim('Test claim that is long enough');
      expect(result.success).toBe(false);
      expect(result.code).toBe('UNAVAILABLE');
    });

    it('returns success with empty verdicts when API returns no results', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ claims: [] }),
      });

      const { checkClaim } = require('@/tools/factChecker');
      const result = await checkClaim('Test claim that is long enough');

      expect(result.success).toBe(true);
      expect(result.claim).toBe('Test claim that is long enough');
      expect(result.verdicts).toEqual([]);
    });

    it('returns success with verdicts when fact checks found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          claims: [
            {
              text: 'Test claim',
              claimReview: [
                {
                  publisher: { name: 'Fact Check 1', site: 'factcheck1.com' },
                  url: 'https://factcheck1.com/article',
                  title: 'False Claim',
                  textualRating: 'False',
                  languageCode: 'en',
                },
              ],
            },
          ],
        }),
      });

      const { checkClaim } = require('@/tools/factChecker');
      const result = await checkClaim('Test claim that is long enough');

      expect(result.success).toBe(true);
      expect(result.verdicts).toHaveLength(1);
      expect(result.verdicts[0].rating).toBe('False');
    });

    it('returns error when API call fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { checkClaim } = require('@/tools/factChecker');
      const result = await checkClaim('Test claim that is long enough');

      expect(result.success).toBe(false);
      expect(result.code).toBe('NETWORK_ERROR');
    });

    it('returns error when API returns non-ok status', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { checkClaim } = require('@/tools/factChecker');
      const result = await checkClaim('Test claim that is long enough');

      expect(result.success).toBe(false);
    });

    it('handles 429 rate limit in checkClaim', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      const { checkClaim } = require('@/tools/factChecker');
      const result = await checkClaim('Test claim that is long enough');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('RATE_LIMITED');
      }
    });

    it('handles timeout error in checkClaim', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('The operation was aborted.'));

      const { checkClaim } = require('@/tools/factChecker');
      const result = await checkClaim('Test claim that is long enough');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('NETWORK_ERROR');
        expect(result.error).toContain('timed out');
      }
    });

    it('handles network error in checkClaim', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const { checkClaim } = require('@/tools/factChecker');
      const result = await checkClaim('Test claim that is long enough');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('NETWORK_ERROR');
      }
    });

    it('parses claim with multiple publishers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          claims: [
            {
              text: 'Test claim',
              claimReview: [
                { publisher: { name: 'Fact Checker 1', site: 'fc1.com' }, textualRating: 'True' },
                { publisher: { name: 'Fact Checker 2', site: 'fc2.com' }, textualRating: 'False' },
                { publisher: { name: 'Fact Checker 3', site: 'fc3.com' }, textualRating: 'Mostly True' },
              ],
            },
          ],
        }),
      });

      const { checkClaim } = require('@/tools/factChecker');
      const result = await checkClaim('Test claim with multiple verdicts');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.verdicts).toHaveLength(3);
      }
    });

    it('handles claim with missing claimReview', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          claims: [
            { text: 'Test claim' },
          ],
        }),
      });

      const { checkClaim } = require('@/tools/factChecker');
      const result = await checkClaim('Test claim no review');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.verdicts).toHaveLength(0);
      }
    });

    it('handles claim with missing publisher info', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          claims: [
            {
              text: 'Test claim',
              claimReview: [
                { textualRating: 'True' },
              ],
            },
          ],
        }),
      });

      const { checkClaim } = require('@/tools/factChecker');
      const result = await checkClaim('Test claim incomplete publisher');

      expect(result.success).toBe(true);
    });

    it('handles claim with various ratings', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          claims: [
            {
              text: 'Test claim',
              claimReview: [
                { publisher: { name: 'A', site: 'a.com' }, textualRating: 'True' },
                { publisher: { name: 'B', site: 'b.com' }, textualRating: 'False' },
                { publisher: { name: 'C', site: 'c.com' }, textualRating: 'Mostly True' },
                { publisher: { name: 'D', site: 'd.com' }, textualRating: 'Mostly False' },
                { publisher: { name: 'E', site: 'e.com' }, textualRating: 'Unverified' },
                { publisher: { name: 'F', site: 'f.com' }, textualRating: 'Pants on Fire' },
                { publisher: { name: 'G', site: 'g.com' }, textualRating: 'Half True' },
              ],
            },
          ],
        }),
      });

      const { checkClaim } = require('@/tools/factChecker');
      const result = await checkClaim('Test various ratings');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.verdicts).toHaveLength(7);
      }
    });

    it('handles claim with Hindi language code', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          claims: [
            {
              text: 'Test claim',
              claimReview: [
                { publisher: { name: 'Fact Check Hindi', site: 'hindifc.com' }, textualRating: 'False', languageCode: 'hi' },
              ],
            },
          ],
        }),
      });

      const { checkClaim } = require('@/tools/factChecker');
      const result = await checkClaim('Test Hindi claim');

      expect(result.success).toBe(true);
    });

    it('handles empty claims array from API', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ claims: [] }),
      });

      const { checkClaim } = require('@/tools/factChecker');
      const result = await checkClaim('Test no results claim');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.verdicts).toHaveLength(0);
      }
    });
  });

  describe('scanNewsForClaims', () => {
    it('returns scan result with 0 scanned for empty array', async () => {
      const { scanNewsForClaims } = require('@/tools/factChecker');
      const articles: any[] = [];
      const result = await scanNewsForClaims(articles);
      expect(result.totalScanned).toBe(0);
      expect(result.annotatedArticles).toHaveLength(0);
    });

    it('processes articles and returns scan results', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ claims: [] }),
      });

      const { scanNewsForClaims } = require('@/tools/factChecker');
      const articles = [
        {
          title: 'Test Article 1',
          url: 'https://example.com/1',
          sourceName: 'Test Source',
          snippet: 'Some content here',
        },
        {
          title: 'Test Article 2',
          url: 'https://example.com/2',
          sourceName: 'Test Source 2',
          snippet: 'More content',
        },
      ] as any;

      const result = await scanNewsForClaims(articles);

      expect(result.totalScanned).toBe(2);
      expect(result.annotatedArticles).toHaveLength(2);
    });

    it('handles article with fact check verdict', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          claims: [
            {
              text: 'Test claim',
              claimReview: [
                {
                  publisher: { name: 'Fact Check 1', site: 'factcheck1.com' },
                  url: 'https://factcheck1.com/article',
                  title: 'False Claim',
                  textualRating: 'False',
                  languageCode: 'en',
                },
              ],
            },
          ],
        }),
      });

      const { scanNewsForClaims } = require('@/tools/factChecker');
      const articles = [
        {
          title: 'Test Article',
          url: 'https://example.com/1',
          sourceName: 'Test Source',
          snippet: 'Test claim here',
        },
      ] as any;

      const result = await scanNewsForClaims(articles);

      expect(result.totalScanned).toBe(1);
      expect(result.annotatedArticles).toHaveLength(1);
    });

    it('handles multiple claims in one article', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          claims: [
            { text: 'Claim 1', claimReview: [{ publisher: { name: 'A', site: 'a.com' }, textualRating: 'True' }] },
            { text: 'Claim 2', claimReview: [{ publisher: { name: 'B', site: 'b.com' }, textualRating: 'False' }] },
          ],
        }),
      });

      const { scanNewsForClaims } = require('@/tools/factChecker');
      const articles = [
        {
          title: 'Test Article',
          url: 'https://example.com/1',
          sourceName: 'Test Source',
          snippet: 'Multiple claims here',
        },
      ] as any;

      const result = await scanNewsForClaims(articles);

      expect(result.totalScanned).toBe(1);
    });

    it('handles API failure during scan gracefully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ claims: [] }) })
        .mockRejectedValueOnce(new Error('API error'));

      const { scanNewsForClaims } = require('@/tools/factChecker');
      const articles = [
        { title: 'Article 1', url: 'https://a.com', sourceName: 'A', snippet: 'Content 1' },
        { title: 'Article 2', url: 'https://b.com', sourceName: 'B', snippet: 'Content 2' },
      ] as any;

      const result = await scanNewsForClaims(articles);

      expect(result.totalScanned).toBe(2);
    });
  });
});