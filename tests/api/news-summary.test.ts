/**
 * Tests for news summary API route.
 * @module tests/api/news-summary
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/news/summary/route';

jest.mock('@/lib/gemini', () => ({
  getGenAIClient: jest.fn(() => ({
    models: {
      generateContent: jest.fn().mockResolvedValue({
        text: JSON.stringify({
          agreedFacts: ['Turnout rose'],
          differingAngles: ['One source focuses on cities'],
          summary: 'A neutral summary.',
        }),
      }),
    },
  })),
  resolveModel: jest.fn().mockResolvedValue('gemini-3.1-flash-lite'),
}));

describe('/api/news/summary', () => {
  it('returns parsed summary JSON from Gemini', async () => {
    const request = new NextRequest('http://localhost:3000/api/news/summary', {
      method: 'POST',
      body: JSON.stringify({
        leftArticle: {
          title: 'A',
          snippet: 'left',
          sourceName: 'Left',
        },
        rightArticle: {
          title: 'B',
          snippet: 'right',
          sourceName: 'Right',
        },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.agreedFacts[0]).toBe('Turnout rose');
    expect(data.summary).toBe('A neutral summary.');
  });
});
