/**
 * Tests for news API route.
 * @module tests/api/news-route
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/news/route';

jest.mock('@/tools', () => ({
  fetchMultiSourceNews: jest.fn(),
  checkClaim: jest.fn(),
}));

import { fetchMultiSourceNews, checkClaim } from '@/tools';

describe('/api/news', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns enriched news sources with fact-check verdicts', async () => {
    (fetchMultiSourceNews as jest.Mock).mockResolvedValueOnce({
      success: true,
      topic: 'India election 2026',
      sources: [
        {
          domain: 'example.com',
          name: 'Example',
          articles: [
            {
              title: 'Election update',
              sourceName: 'Example',
              sourceDomain: 'example.com',
              url: 'https://example.com/a',
              publishedAt: '2025-01-01T00:00:00.000Z',
              snippet: 'Snippet text',
              language: 'en',
              faviconUrl: 'https://example.com/favicon.ico',
            },
          ],
        },
      ],
      totalArticles: 1,
      fetchedAt: '2025-01-01T00:00:00.000Z',
    });
    (checkClaim as jest.Mock).mockResolvedValueOnce({
      success: true,
      claim: 'Election update',
      verdicts: [
        {
          publisher: 'Fact Check',
          rating: 'True',
          normalizedRating: 'TRUE',
          url: 'https://fact.example',
        },
      ],
      checkedAt: '2025-01-01T00:00:00.000Z',
    });

    const request = new NextRequest('http://localhost:3000/api/news?topic=India%20election%202026');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.sources[0].articles[0].factCheckVerdicts).toHaveLength(1);
  });
});
