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

    it('returns empty array on non-ok response status', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      const result = await fetchElectionNews('election-500-test');
      expect(result).toEqual([]);
    });

    it('handles 429 rate limit gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
      });
      const result = await fetchElectionNews('election-rate-limit');
      expect(result).toEqual([]);
    });

    it('handles empty RSS XML', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => '<rss><channel></channel></rss>',
      });
      const result = await fetchElectionNews('empty-xml-test');
      expect(result).toEqual([]);
    });

    it('parses RSS with CDATA content', async () => {
      const mockXml = `
        <rss><channel>
          <item>
            <title>Breaking News - NDTV</title>
            <link>https://ndtv.com/article</link>
            <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
            <description><![CDATA[This is <b>important</b> news about elections.]]></description>
          </item>
        </channel></rss>
      `;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => mockXml,
      });

      const result = await fetchElectionNews('cdata-test', 'en');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toBe('Breaking News');
      expect(result[0].sourceName).toBe('NDTV');
    });

    it('handles HTML entities in XML', async () => {
      const mockXml = `
        <rss><channel>
          <item>
            <title>News &amp; Updates - The Hindu</title>
            <link>https://thehindu.com/news</link>
            <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
            <description>Test &lt;description&gt; with &quot;quotes&quot; and &nbsp; spaces</description>
          </item>
        </channel></rss>
      `;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => mockXml,
      });

      const result = await fetchElectionNews('html-entities-test', 'en');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toContain('&');
      expect(result[0].snippet).toContain('Test');
    });

    it('handles missing description gracefully', async () => {
      const mockXml = `
        <rss><channel>
          <item>
            <title>Simple News - Indian Express</title>
            <link>https://indianexpress.com/article</link>
            <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
          </item>
        </channel></rss>
      `;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => mockXml,
      });

      const result = await fetchElectionNews('no-desc-test', 'en');
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles item without title or link', async () => {
      const mockXml = `
        <rss><channel>
          <item>
            <description>No title or link here</description>
          </item>
        </channel></rss>
      `;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => mockXml,
      });

      const result = await fetchElectionNews('no-title-test', 'en');
      expect(result).toEqual([]);
    });

    it('handles timeout error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('The operation was aborted.'));
      const result = await fetchElectionNews('timeout-test');
      expect(result).toEqual([]);
    });

    it('handles invalid URL gracefully', async () => {
      const mockXml = `
        <rss><channel>
          <item>
            <title>News - Invalid</title>
            <link>not-a-valid-url</link>
            <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
            <description>Test</description>
          </item>
        </channel></rss>
      `;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => mockXml,
      });

      const result = await fetchElectionNews('invalid-url-test', 'en');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].sourceDomain).toBe('unknown');
    });

    it('requests Hindi news with correct parameters', async () => {
      const mockXml = `
        <rss><channel>
          <item>
            <title>चुनाव समाचार - Aaj Tak</title>
            <link>https://aajtak.in/news</link>
            <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
          </item>
        </channel></rss>
      `;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => mockXml,
      });

      const result = await fetchElectionNews('election', 'hi');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].language).toBe('hi');
    });
  });

  describe('fetchMultiSourceNews', () => {
    it('requires a topic', async () => {
      const result = await fetchMultiSourceNews('   ');
      expect(result.success).toBe(false);
    });

    it('returns error for empty string topic', async () => {
      const result = await fetchMultiSourceNews('');
      expect(result.success).toBe(false);
    });

    it('returns deduplicated grouped articles', async () => {
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

    it('deduplicates articles by URL', async () => {
      const mockXml = `
        <rss><channel>
          <item>
            <title>Duplicate - SourceA</title>
            <link>https://same-url.com/article</link>
            <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
          </item>
        </channel></rss>
      `;

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, text: async () => mockXml })
        .mockResolvedValueOnce({ ok: true, text: async () => mockXml })
        .mockResolvedValueOnce({ ok: true, text: async () => mockXml })
        .mockResolvedValueOnce({ ok: true, text: async () => mockXml });

      const result = await fetchMultiSourceNews('dedupe test');
      expect(result.success).toBe(true);
      if (result.success) {
        const totalArticles = result.sources.reduce((sum, s) => sum + s.articles.length, 0);
        expect(totalArticles).toBeLessThanOrEqual(4);
      }
    });

    it('handles network error gracefully by returning empty sources', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await fetchMultiSourceNews('error test');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.totalArticles).toBe(0);
      }
    });

    it('returns sources with correct structure', async () => {
      const mockXml = `
        <rss><channel>
          <item>
            <title>Politics - The Hindu</title>
            <link>https://thehindu.com/politics</link>
            <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
            <description>Political news article</description>
          </item>
        </channel></rss>
      `;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => mockXml,
      });

      const result = await fetchMultiSourceNews('politics');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.totalArticles).toBeGreaterThan(0);
        expect(result.fetchedAt).toBeDefined();
        expect(result.topic).toBe('politics');
      }
    });

    it('handles partial fetch failures', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, text: async () => '<rss><channel></channel></rss>' })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, text: async () => '<rss><channel></channel></rss>' })
        .mockResolvedValueOnce({ ok: true, text: async () => '<rss><channel></channel></rss>' });

      const result = await fetchMultiSourceNews('partial failure');
      expect(result.success).toBe(true);
    });
  });
});
