/**
 * News Aggregator — Fetches election news from Google News RSS,
 * ensuring multi-source coverage for unbiased reporting.
 *
 * Parses Google News RSS XML feeds, extracts structured article data,
 * and groups results by source domain. Enforces a minimum of 3 different
 * sources to present diverse perspectives.
 *
 * Results are cached for 15 minutes via the shared newsCache.
 *
 * @module tools/newsAggregator
 */

/**
 * GOOGLE SERVICE: Google News RSS
 * PURPOSE: Provides diverse, multi-source coverage of election-related news queries. Ensures users see multiple media perspectives to combat bias.
 * ALTERNATIVES CONSIDERED: Third-party news APIs (often expensive, rate-limited, or lacking localized Indian election coverage).
 * API DOCS: https://news.google.com/
 */

import { getNewsCache, buildCacheKey } from '@/lib/newsCache';
import type {
  NewsArticle,
  NewsSource,
  MultiSourceNewsResult,
  NewsLanguage,
} from '@/types';

// ─── Constants ──────────────────────────────────────────────────────────────

/** Google News RSS search URL template */
const GNEWS_RSS_URL = 'https://news.google.com/rss/search';

/** Maximum articles to return per call */
const MAX_ARTICLES = 6;

/** Minimum number of unique source domains required */
const MIN_SOURCES = 3;

// ─── Single-Query Fetcher ───────────────────────────────────────────────────

/**
 * Fetches election news articles from Google News RSS for a given query.
 *
 * Constructs the RSS URL with language/region parameters, parses the XML
 * response, and extracts structured article data. Returns the top 6 articles
 * from at least 3 different source domains.
 *
 * @param query - Search query (e.g., "Lok Sabha 2024", "Bihar election").
 * @param lang - Language code: 'en' for English, 'hi' for Hindi.
 * @returns Array of parsed news articles.
 *
 * @example
 * ```ts
 * const articles = await fetchElectionNews("Karnataka election results", "en");
 * ```
 */
export async function fetchElectionNews(
  query: string,
  lang: NewsLanguage = 'en'
): Promise<NewsArticle[]> {
  const cacheKey = buildCacheKey('news-single', { query, lang });
  const cache = getNewsCache();
  const cached = cache.get<NewsArticle[]>(cacheKey);
  if (cached) {
    console.log(`[NewsAggregator] Cache hit: ${cacheKey}`);
    return cached;
  }
  console.log(`[NewsAggregator] Cache miss: ${cacheKey}`);

  try {
    const searchQuery = encodeURIComponent(`${query} election India`);
    const url =
      `${GNEWS_RSS_URL}?q=${searchQuery}` +
      `&hl=${lang}-IN&gl=IN&ceid=IN:${lang}`;

    console.log(`[NewsAggregator] Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MataData-ElectionAssistant/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 429) {
      console.warn('[NewsAggregator] Rate limited - trying to return cached data');
      const cached = cache.get<NewsArticle[]>(cacheKey);
      if (cached) return cached;
      return [];
    }
    if (!response.ok) {
      console.warn(`[NewsAggregator] RSS returned status ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const articles = parseRssXml(xml, lang);

    // Ensure diversity: pick from at least MIN_SOURCES domains
    const diverse = enforceSourceDiversity(articles, MAX_ARTICLES, MIN_SOURCES);

    cache.set(cacheKey, diverse);
    return diverse;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[NewsAggregator] Fetch failed: ${msg}`);
    return [];
  }
}

// ─── Multi-Source Fetcher ───────────────────────────────────────────────────

/**
 * Fetches news on a topic using multiple query phrasings, then
 * deduplicates and groups results by source domain.
 *
 * This ensures unbiased coverage by:
 * 1. Using 3 different phrasings of the same topic
 * 2. Deduplicating by URL
 * 3. Grouping articles by source domain for side-by-side comparison
 *
 * @param topic - The election topic to search for.
 * @returns Structured multi-source result with articles grouped by domain.
 *
 * @example
 * ```ts
 * const result = await fetchMultiSourceNews("EVM controversy");
 * if (result.success) {
 *   result.sources.forEach(s => console.log(s.domain, s.articles.length));
 * }
 * ```
 */
export async function fetchMultiSourceNews(
  topic: string
): Promise<MultiSourceNewsResult> {
  if (!topic || topic.trim().length === 0) {
    return {
      success: false,
      error: 'Topic is required for news search.',
      code: 'INVALID_INPUT',
    };
  }

  const cacheKey = buildCacheKey('news-multi', { topic });
  const cache = getNewsCache();
  const cached = cache.get<MultiSourceNewsResult>(cacheKey);
  if (cached) {
    console.log(`[NewsAggregator] Cache hit (multi): ${cacheKey}`);
    return cached;
  }
  console.log(`[NewsAggregator] Cache miss (multi): ${cacheKey}`);

  try {
    const trimmed = topic.trim();

    // 3 different query phrasings for the same topic
    const queries = [
      trimmed,
      `${trimmed} latest news`,
      `${trimmed} update today`,
    ];

    // Fetch from all phrasings in parallel (English + Hindi)
    const allFetches = await Promise.all([
      ...queries.map((q) => fetchElectionNews(q, 'en')),
      fetchElectionNews(trimmed, 'hi'),
    ]);

    const allArticles = allFetches.flat();

    // Deduplicate by URL
    const seen = new Set<string>();
    const unique: NewsArticle[] = [];
    for (const article of allArticles) {
      if (!seen.has(article.url)) {
        seen.add(article.url);
        unique.push(article);
      }
    }

    // Group by source name (not domain - Google News RSS redirects all through news.google.com)
    const sourceMap = new Map<string, NewsArticle[]>();
    for (const article of unique) {
      const key = article.sourceName || article.sourceDomain;
      const existing = sourceMap.get(key) || [];
      existing.push(article);
      sourceMap.set(key, existing);
    }

    // Build sources array
    const sources: NewsSource[] = Array.from(sourceMap.entries())
      .map(([name, articles]) => ({
        domain: articles[0]?.sourceDomain || 'unknown',
        name,
        articles: articles.slice(0, 3), // Max 3 per source
      }))
      .sort((a, b) => b.articles.length - a.articles.length);

    const totalArticles = sources.reduce(
      (sum, s) => sum + s.articles.length,
      0
    );

    const result: MultiSourceNewsResult = {
      success: true,
      topic: trimmed,
      sources,
      totalArticles,
      fetchedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[NewsAggregator] Multi-source fetch failed: ${msg}`);
    return {
      success: false,
      error: `Failed to fetch news: ${msg}`,
      code: 'NETWORK_ERROR',
    };
  }
}

// ─── XML Parser ─────────────────────────────────────────────────────────────

/**
 * Parses Google News RSS XML into typed NewsArticle objects.
 * Uses regex-based parsing to avoid XML library dependencies.
 *
 * @param xml - Raw RSS XML string from Google News.
 * @param lang - Language of the feed.
 * @returns Array of parsed news articles.
 */
function parseRssXml(xml: string, lang: NewsLanguage): NewsArticle[] {
  const articles: NewsArticle[] = [];

  // Extract all <item> blocks
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link');
    const pubDate = extractTag(itemXml, 'pubDate');
    // Try description first, fall back to content:encoded
    const description = extractTag(itemXml, 'description') || extractTag(itemXml, 'content:encoded') || '';

    if (!title || !link) continue;

    // Extract source name from the title suffix "- Source Name"
    const sourceMatch = title.match(/\s-\s([^-]+)$/);
    const sourceName = sourceMatch ? sourceMatch[1].trim() : 'Unknown';
    const cleanTitle = sourceMatch
      ? title.slice(0, sourceMatch.index).trim()
      : title;

    // Extract domain from URL
    const domain = extractDomain(link);

// Clean HTML from description - handle HTML entities and extract text
    let snippet = '';
    if (description) {
      // First decode HTML entities, then strip tags
      const decoded = decodeHtmlEntities(description);
      snippet = stripHtml(decoded).trim();
    }
    // If snippet is empty or just looks like a link, use title as fallback
    if (!snippet || snippet.startsWith('href=') || snippet.startsWith('<a')) {
      snippet = cleanTitle;
    }
    snippet = snippet.slice(0, 200);

    articles.push({
      title: decodeHtmlEntities(cleanTitle),
      sourceName: decodeHtmlEntities(sourceName),
      sourceDomain: domain,
      url: link,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      snippet: decodeHtmlEntities(snippet),
      language: lang,
      faviconUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
    });
  }

  return articles;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Extracts content of an XML tag using regex.
 */
function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
  const m = regex.exec(xml);
  return m ? (m[1] || m[2] || '').trim() : null;
}

/**
 * Extracts the domain from a URL string.
 */
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

/**
 * Strips HTML tags from a string.
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Decodes common HTML entities.
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/**
 * Selects articles ensuring diversity across source domains.
 * Picks round-robin from each domain until the max count is reached.
 *
 * @param articles - All available articles.
 * @param maxCount - Maximum articles to return.
 * @param minSources - Minimum unique sources required.
 * @returns Diverse subset of articles.
 */
function enforceSourceDiversity(
  articles: NewsArticle[],
  maxCount: number,
  minSources: number
): NewsArticle[] {
  // Group by domain
  const byDomain = new Map<string, NewsArticle[]>();
  for (const a of articles) {
    const list = byDomain.get(a.sourceDomain) || [];
    list.push(a);
    byDomain.set(a.sourceDomain, list);
  }

  // If we have fewer sources than min, return what we have
  if (byDomain.size < minSources) {
    return articles.slice(0, maxCount);
  }

  // Round-robin pick from each domain
  const result: NewsArticle[] = [];
  const domains = Array.from(byDomain.keys());
  let idx = 0;

  while (result.length < maxCount) {
    const domain = domains[idx % domains.length];
    const domainArticles = byDomain.get(domain);

    if (domainArticles && domainArticles.length > 0) {
      result.push(domainArticles.shift()!);
    } else {
      // Remove exhausted domain
      domains.splice(idx % domains.length, 1);
      if (domains.length === 0) break;
      continue;
    }

    idx++;
  }

  return result;
}
