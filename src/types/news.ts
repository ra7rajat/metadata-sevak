/**
 * News and fact-check types.
 * @module types/news
 */

import type { ToolError } from './tools';

export type NewsLanguage = 'en' | 'hi';

export interface NewsArticle {
  title: string;
  sourceName: string;
  sourceDomain: string;
  url: string;
  publishedAt: string;
  snippet: string;
  language: NewsLanguage;
  faviconUrl: string;
  factCheckVerdicts?: FactCheckVerdict[];
}

export interface NewsSource {
  domain: string;
  name: string;
  articles: NewsArticle[];
}

export interface MultiSourceNewsSuccess {
  success: true;
  topic: string;
  sources: NewsSource[];
  totalArticles: number;
  fetchedAt: string;
}

export type MultiSourceNewsResult = MultiSourceNewsSuccess | ToolError;

export interface FactCheckVerdict {
  publisher: string;
  rating: string;
  normalizedRating: 'TRUE' | 'FALSE' | 'MISSING_CONTEXT' | 'UNVERIFIED';
  url: string;
}

export interface ClaimCheckSuccess {
  success: true;
  claim: string;
  verdicts: FactCheckVerdict[];
  checkedAt: string;
}

export type ClaimCheckResult = ClaimCheckSuccess | ToolError;

export interface AnnotatedArticle extends NewsArticle {
  extractedClaims: string[];
  claimResults: ClaimCheckResult[];
}

export interface ScanResult {
  totalScanned: number;
  articlesWithVerdicts: number;
  annotatedArticles: AnnotatedArticle[];
  scannedAt: string;
}