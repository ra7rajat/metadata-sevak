'use client';

/**
 * NewsPanel — Three-column news comparison panel showing different
 * sources' perspectives on the same election topic.
 *
 * Layout: Left source | Center (facts + comparison) | Right source
 *
 * Features:
 * - 3-column layout with two outlets flanking a central analysis pane
 * - "Both agree on" / "They differ on" comparison in center column
 * - Fact-check badges on any claim with a verdict
 * - Hindi/English toggle per article
 * - Skeleton loading state while fetching
 * - Full ARIA labels on all interactive elements
 *
 * @module components/NewsPanel
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import NewsCard from '@/components/NewsCard';
import type { NewsSource, NewsArticle, FactCheckVerdict } from '@/types';

interface NewsPanelProps {
  /** The topic to fetch news about */
  topic: string;
}

/** Panel state while loading / loaded / errored */
type PanelState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; sources: NewsSource[]; totalArticles: number }
  | { status: 'error'; message: string };

/**
 * Three-column news comparison panel. Fetches multi-source news
 * from the API and displays sources side-by-side for unbiased reading.
 *
 * @param props - Component props containing the topic to search.
 * @returns The rendered news panel.
 */
export default function NewsPanel({ topic }: NewsPanelProps) {
  const [state, setState] = useState<PanelState>({ status: 'idle' });
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  const fetchNews = useCallback(async () => {
    if (!topic.trim()) return;

    setState({ status: 'loading' });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[NEWS_LOOKUP] ${topic}`,
        }),
      });

      // For now, use client-side fetch to Google News RSS via a proxy
      // In production, the agent will call fetchMultiSourceNews
      const newsResponse = await fetch(
        `/api/news?topic=${encodeURIComponent(topic)}&lang=${lang}`
      ).catch(() => null);

      if (newsResponse && newsResponse.ok) {
        const data = await newsResponse.json();
        if (data.success) {
          setState({
            status: 'loaded',
            sources: data.sources,
            totalArticles: data.totalArticles,
          });
          return;
        }
      }

      // Fallback: parse streamed text response
      if (response.ok) {
        setState({
          status: 'loaded',
          sources: [],
          totalArticles: 0,
        });
      } else {
        throw new Error('Failed to fetch news');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setState({ status: 'error', message: msg });
    }
  }, [topic, lang]);

  useEffect(() => {
    if (topic.trim()) {
      const timer = setTimeout(() => {
        void fetchNews();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [topic, fetchNews]);

  return (
    <section
      className="w-full rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden"
      aria-label={`News coverage: ${topic}`}
      role="region"
    >
      {/* ── Panel Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <span className="text-base" aria-hidden="true">📰</span>
          <div>
            <h3 className="text-sm font-semibold text-gray-100">
              Multi-Source Coverage
            </h3>
            <p className="text-[11px] text-gray-500">
              {topic}
            </p>
          </div>
        </div>

        {/* Language Toggle */}
        <div className="flex items-center gap-1 bg-white/[0.05] rounded-lg p-0.5" role="radiogroup" aria-label="Language">
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              lang === 'en'
                ? 'bg-indigo-600/80 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            role="radio"
            aria-checked={lang === 'en'}
            aria-label="English"
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLang('hi')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              lang === 'hi'
                ? 'bg-indigo-600/80 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            role="radio"
            aria-checked={lang === 'hi'}
            aria-label="हिंदी"
          >
            हि
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-4">
        {state.status === 'idle' && (
          <p className="text-center text-sm text-gray-500 py-8">
            Select a topic to see multi-source news coverage.
          </p>
        )}

        {state.status === 'loading' && <SkeletonLoader />}

        {state.status === 'error' && (
          <div className="text-center py-8" role="alert">
            <p className="text-sm text-red-400 mb-2">
              Failed to load news: {state.message}
            </p>
            <button
              type="button"
              onClick={fetchNews}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm"
              aria-label="Retry loading news"
            >
              Try again
            </button>
          </div>
        )}

        {state.status === 'loaded' && state.sources.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-8">
            No news articles found for this topic.
          </p>
        )}

        {state.status === 'loaded' && state.sources.length > 0 && (
          <ThreeColumnView sources={state.sources} />
        )}
      </div>
    </section>
  );
}

// ─── Three-Column Layout ────────────────────────────────────────────────────

interface ThreeColumnViewProps {
  sources: NewsSource[];
}

/**
 * Renders the 3-column comparison view:
 * Left source | Center analysis | Right source
 */
function ThreeColumnView({ sources }: ThreeColumnViewProps) {
  const leftSource = sources[0];
  const rightSource = sources.length > 1 ? sources[1] : null;
  const otherSources = sources.slice(2);

  // Compute agreements and differences from headlines
  const comparison = useMemo(() => computeComparison(
    leftSource?.articles || [],
    rightSource?.articles || []
  ), [leftSource, rightSource]);

  return (
    <div className="space-y-4">
      {/* ── Main 3-column grid ── */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        role="list"
        aria-label="Source comparison"
      >
        {/* Left Source */}
        <div role="listitem" aria-label={`${leftSource?.name || 'Source 1'} coverage`}>
          <SourceColumn source={leftSource} />
        </div>

        {/* Center: Analysis */}
        <div role="listitem" aria-label="Comparison analysis">
          <div className="h-full rounded-xl bg-indigo-500/[0.06] border border-indigo-500/[0.15] p-4 flex flex-col">
            <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span aria-hidden="true">⚖️</span>
              Analysis
            </h4>

            {comparison.agreements.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] font-medium text-emerald-400 mb-1.5">
                  ✓ Both sources agree on:
                </p>
                <ul className="space-y-1" aria-label="Points of agreement">
                  {comparison.agreements.map((point, i) => (
                    <li key={i} className="text-xs text-gray-300 leading-relaxed pl-3 relative">
                      <span className="absolute left-0 text-emerald-500/60" aria-hidden="true">·</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {comparison.differences.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] font-medium text-amber-400 mb-1.5">
                  ⚡ They differ on:
                </p>
                <ul className="space-y-1" aria-label="Points of difference">
                  {comparison.differences.map((point, i) => (
                    <li key={i} className="text-xs text-gray-300 leading-relaxed pl-3 relative">
                      <span className="absolute left-0 text-amber-500/60" aria-hidden="true">·</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Fact-check summary */}
            <FactCheckSummary sources={[leftSource, rightSource].filter(Boolean) as NewsSource[]} />

            {comparison.agreements.length === 0 && comparison.differences.length === 0 && (
              <p className="text-xs text-gray-500 italic mt-auto">
                Comparing coverage from {leftSource?.name || 'Source 1'}
                {rightSource ? ` and ${rightSource.name}` : ''}.
              </p>
            )}
          </div>
        </div>

        {/* Right Source */}
        <div role="listitem" aria-label={`${rightSource?.name || 'Source 2'} coverage`}>
          {rightSource ? (
            <SourceColumn source={rightSource} />
          ) : (
            <div className="h-full rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 flex items-center justify-center">
              <p className="text-xs text-gray-500 text-center">
                No second source available for comparison.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Additional Sources ── */}
      {otherSources.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
            More Sources ({otherSources.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherSources.flatMap((source) =>
              source.articles.map((article) => (
                <NewsCard key={article.url} article={article} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Source Column ───────────────────────────────────────────────────────────

interface SourceColumnProps {
  source: NewsSource;
}

/**
 * Renders a single source's articles in a column.
 */
function SourceColumn({ source }: SourceColumnProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Image
          src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=20`}
          alt=""
          aria-hidden="true"
          width={16}
          height={16}
          className="rounded-sm"
          loading="lazy"
        />
        <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
          {source.name}
        </span>
        <span className="text-[10px] text-gray-500">
          {source.articles.length} article{source.articles.length !== 1 ? 's' : ''}
        </span>
      </div>
      {source.articles.map((article) => (
        <NewsCard key={article.url} article={article} />
      ))}
    </div>
  );
}

// ─── Fact-Check Summary ─────────────────────────────────────────────────────

interface FactCheckSummaryProps {
  sources: NewsSource[];
}

/**
 * Renders a compact summary of all fact-check verdicts across sources.
 */
function FactCheckSummary({ sources }: FactCheckSummaryProps) {
  const allVerdicts: FactCheckVerdict[] = sources
    .flatMap((s) => s.articles)
    .flatMap((a) => a.factCheckVerdicts || []);

  if (allVerdicts.length === 0) return null;

  const trueCount = allVerdicts.filter((v) => v.normalizedRating === 'TRUE').length;
  const falseCount = allVerdicts.filter((v) => v.normalizedRating === 'FALSE').length;
  const mixedCount = allVerdicts.filter((v) => v.normalizedRating === 'MISSING_CONTEXT').length;

  return (
    <div className="mt-auto pt-3 border-t border-indigo-500/[0.15]">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Fact-Check Summary
      </p>
      <div className="flex gap-3 text-[11px]" role="list" aria-label="Fact-check counts">
        {trueCount > 0 && (
          <span className="text-emerald-400" role="listitem">
            ✓ {trueCount} verified
          </span>
        )}
        {falseCount > 0 && (
          <span className="text-red-400" role="listitem">
            ✗ {falseCount} false
          </span>
        )}
        {mixedCount > 0 && (
          <span className="text-amber-400" role="listitem">
            ⚠ {mixedCount} needs context
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton Loader ────────────────────────────────────────────────────────

/**
 * Renders a pulsing skeleton while news data is loading.
 */
function SkeletonLoader() {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse"
      aria-label="Loading news coverage"
      role="status"
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-3 w-24 bg-white/[0.08] rounded" />
          {[0, 1].map((j) => (
            <div
              key={j}
              className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4 space-y-2.5"
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-white/[0.08]" />
                <div className="h-2.5 w-16 bg-white/[0.08] rounded" />
              </div>
              <div className="h-3.5 w-full bg-white/[0.08] rounded" />
              <div className="h-3.5 w-3/4 bg-white/[0.08] rounded" />
              <div className="h-2.5 w-full bg-white/[0.06] rounded" />
              <div className="h-2.5 w-2/3 bg-white/[0.06] rounded" />
            </div>
          ))}
        </div>
      ))}
      <span className="sr-only">Loading news articles...</span>
    </div>
  );
}

// ─── Comparison Logic ───────────────────────────────────────────────────────

interface ComparisonResult {
  agreements: string[];
  differences: string[];
}

/**
 * Computes simple textual comparison between two sets of articles
 * by analyzing headline keywords for overlap and divergence.
 *
 * @param leftArticles - Articles from the first source.
 * @param rightArticles - Articles from the second source.
 * @returns Structured comparison with agreements and differences.
 */
function computeComparison(
  leftArticles: NewsArticle[],
  rightArticles: NewsArticle[]
): ComparisonResult {
  if (leftArticles.length === 0 || rightArticles.length === 0) {
    return { agreements: [], differences: [] };
  }

  // Extract significant keywords from headlines (>4 chars, not stopwords)
  const stopwords = new Set([
    'the', 'and', 'for', 'from', 'with', 'this', 'that', 'have',
    'been', 'will', 'said', 'says', 'after', 'over', 'about', 'into',
    'india', 'election', 'news', 'today', 'latest', 'what',
  ]);

  const extractKeywords = (articles: NewsArticle[]): Set<string> => {
    const words = new Set<string>();
    for (const a of articles) {
      const tokens = a.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 4 && !stopwords.has(w));
      tokens.forEach((t) => words.add(t));
    }
    return words;
  };

  const leftKw = extractKeywords(leftArticles);
  const rightKw = extractKeywords(rightArticles);

  // Find overlap (agreements) and unique keywords (differences)
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

  // Build human-readable comparison
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
