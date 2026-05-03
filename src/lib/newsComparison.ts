/**
 * News comparison logic - computes agreements and differences between sources.
 * @module lib/newsComparison
 */

import type { NewsArticle } from '@/types';

export interface ComparisonResult {
  agreements: string[];
  differences: string[];
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'from', 'with', 'this', 'that', 'have',
  'been', 'will', 'said', 'says', 'after', 'over', 'about', 'into',
  'india', 'election', 'news', 'today', 'latest', 'what',
]);

function extractKeywords(articles: NewsArticle[]): Set<string> {
  const words = new Set<string>();
  for (const a of articles) {
    const tokens = a.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 4 && !STOPWORDS.has(w));
    tokens.forEach((t) => words.add(t));
  }
  return words;
}

/**
 * Computes textual comparison between two sets of articles
 * by analyzing headline keywords for overlap and divergence.
 */
export function computeComparison(
  leftArticles: NewsArticle[],
  rightArticles: NewsArticle[]
): ComparisonResult {
  if (leftArticles.length === 0 || rightArticles.length === 0) {
    return { agreements: [], differences: [] };
  }

  const leftKw = extractKeywords(leftArticles);
  const rightKw = extractKeywords(rightArticles);

  const shared: string[] = [];
  const leftOnly: string[] = [];
  const rightOnly: string[] = [];

  for (const kw of leftKw) {
    if (rightKw.has(kw)) shared.push(kw);
    else leftOnly.push(kw);
  }
  for (const kw of rightKw) {
    if (!leftKw.has(kw)) rightOnly.push(kw);
  }

  const agreements: string[] = [];
  const differences: string[] = [];

  if (shared.length > 0) {
    agreements.push(
      `Both cover: ${shared.slice(0, 4).join(', ')}`
    );
  }

  if (leftOnly.length > 0 && leftArticles.length > 0) {
    differences.push(
      `${leftArticles[0].sourceName} emphasizes: ${leftOnly.slice(0, 3).join(', ')}`
    );
  }

  if (rightOnly.length > 0 && rightArticles.length > 0) {
    differences.push(
      `${rightArticles[0].sourceName} emphasizes: ${rightOnly.slice(0, 3).join(', ')}`
    );
  }

  return { agreements, differences };
}