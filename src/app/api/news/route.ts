import { NextRequest } from 'next/server';
import { checkClaim, fetchMultiSourceNews } from '@/tools';
import type { NewsArticle, NewsSource } from '@/types';

/**
 * Enriches news sources with fact-check verdicts for each article.
 * Calls Google Fact Check API for each article title and snippet.
 * @param sources - Array of news sources to enrich.
 * @returns Sources with fact-check data attached.
 */
async function enrichSources(sources: NewsSource[]): Promise<NewsSource[]> {
  return Promise.all(
    sources.map(async (source) => ({
      ...source,
      articles: await Promise.all(
        source.articles.map(async (article) => {
          const factCheck = await checkClaim(`${article.title}. ${article.snippet}`);
          return {
            ...article,
            factCheckVerdicts: factCheck.success ? factCheck.verdicts.slice(0, 1) : [],
          } satisfies NewsArticle;
        })
      ),
    }))
  );
}

export async function GET(request: NextRequest): Promise<Response> {
  const topic = request.nextUrl.searchParams.get('topic') || 'India election 2026';
  const result = await fetchMultiSourceNews(topic);
  if (!result.success) {
    return Response.json(result);
  }

  const enrichedSources = await enrichSources(result.sources);
  return Response.json({
    ...result,
    sources: enrichedSources,
  });
}
