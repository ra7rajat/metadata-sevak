/**
 * Tests for newsAggregator tool.
 * Covers happy path, error handling, edge cases.
 * @module tests/tools/newsAggregator
 */

import { fetchMultiSourceNews, fetchElectionNews } from '@/tools/newsAggregator';

global.fetch = jest.fn();

describe('newsAggregator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchElectionNews', () => {
    it('returns parsed articles from RSS', async () => {
      const mockXml = `
        <rss><channel>
          <item>
            <title>Election Update - The Times</title>
            <link>https://thetimes.com/news/123</link>
            <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
            <description>Some description about the election.</description>
          </item>
        </channel></rss>
      `;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => mockXml,
      });

      const result = await fetchElectionNews('election-test-1', 'en');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toBe('Election Update');
      expect(result[0].sourceName).toBe('The Times');
      expect(result[0].sourceDomain).toBe('thetimes.com');
    });

    it('returns empty array on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      const result = await fetchElectionNews('election-error-test');
      expect(result).toEqual([]);
    });
  });

  describe('fetchMultiSourceNews', () => {
    it('requires a topic', async () => {
      const result = await fetchMultiSourceNews('   ');
      expect(result.success).toBe(false);
    });

    it('returns deduplicated grouped articles', async () => {
      // Return same article for multiple fetches
      const mockXml = `
        <rss><channel>
          <item>
            <title>Test - SourceA</title>
            <link>https://sourcea.com/1</link>
            <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
          </item>
        </channel></rss>
      `;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => mockXml,
      });

      const result = await fetchMultiSourceNews('test topic');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.sources.length).toBeGreaterThan(0);
        expect(result.sources[0].domain).toBe('sourcea.com');
      }
    });
  });
});
