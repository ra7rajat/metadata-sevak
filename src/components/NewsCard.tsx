'use client';

import Image from 'next/image';

/**
 * NewsCard — Displays a single news article with source attribution,
 * fact-check badge, and relative timestamp.
 *
 * Features:
 * - Source favicon + name
 * - Headline with 2-line snippet
 * - Fact-check badge (✓ TRUE / ✗ FALSE / ⚠ MISSING CONTEXT)
 * - "Read original" link (opens in new tab)
 * - Relative time display ("2 hours ago")
 *
 * @module components/NewsCard
 */

import React from 'react';
import type { NewsArticle, FactCheckVerdict } from '@/types';

interface NewsCardProps {
  /** The news article to display */
  article: NewsArticle;
}

/**
 * Formats an ISO timestamp as a relative time string (e.g., "2 hours ago").
 */
function formatRelativeTime(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 0) return 'Just now';

    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

// ─── Fact-Check Badge ───────────────────────────────────────────────────────

interface FactCheckBadgeProps {
  verdict: FactCheckVerdict;
}

/**
 * Renders a color-coded fact-check badge based on the verdict.
 */
function FactCheckBadge({ verdict }: FactCheckBadgeProps) {
  const config = getBadgeConfig(verdict.normalizedRating);

  return (
    <a
      href={verdict.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
        border transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500
        ${config.classes}
      `}
      role="listitem"
      aria-label={`Fact check by ${verdict.publisher}: ${verdict.rating}`}
      title={`${verdict.publisher}: ${verdict.rating}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      <span className="truncate max-w-[100px]">{verdict.rating}</span>
    </a>
  );
}

/**
 * Returns styling configuration for a fact-check badge.
 */
function getBadgeConfig(
  rating: FactCheckVerdict['normalizedRating']
): { icon: string; classes: string } {
  switch (rating) {
    case 'TRUE':
      return {
        icon: '✓',
        classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      };
    case 'FALSE':
      return {
        icon: '✗',
        classes: 'bg-red-500/15 text-red-400 border-red-500/30',
      };
    case 'MISSING_CONTEXT':
      return {
        icon: '⚠',
        classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      };
    case 'UNVERIFIED':
    default:
      return {
        icon: '?',
        classes: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
      };
  }
}

/**
 * Renders a compact news article card with source attribution,
 * fact-check verdicts, and a link to the original article.
 *
 * @param props - Component props containing the article.
 * @returns The rendered news card element.
 */
export default React.memo(function NewsCard({ article }: NewsCardProps) {
  const hasVerdicts =
    article.factCheckVerdicts && article.factCheckVerdicts.length > 0;

  return (
    <article
      className="
        group rounded-xl bg-white/[0.04] border border-white/[0.08]
        hover:bg-white/[0.07] hover:border-white/[0.15]
        transition-all duration-200 overflow-hidden
        focus-within:ring-2 focus-within:ring-indigo-500/40
      "
      aria-label={`News article: ${article.title}`}
    >
      <div className="p-4">
        {/* ── Source Header ── */}
        <div className="flex items-center gap-2 mb-2.5">
          <Image
            src={article.faviconUrl}
            alt=""
            aria-hidden="true"
            width={16}
            height={16}
            className="rounded-sm flex-shrink-0"
            loading="lazy"
          />
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider truncate">
            {article.sourceName}
          </span>
          <span className="text-[10px] text-gray-500 ml-auto flex-shrink-0">
            {formatRelativeTime(article.publishedAt)}
          </span>
        </div>

        {/* ── Headline ── */}
        <h3
          className="text-sm font-semibold text-gray-100 leading-snug mb-1.5 line-clamp-2 group-hover:text-white transition-colors"
          lang={article.language === 'hi' ? 'hi' : 'en'}
        >
          {article.title}
        </h3>

        {/* ── Snippet ── */}
        <p
          className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3"
          lang={article.language === 'hi' ? 'hi' : 'en'}
        >
          {article.snippet}
        </p>

        {/* ── Fact-Check Badges ── */}
        {hasVerdicts && (
          <div
            className="flex flex-wrap gap-1.5 mb-3"
            role="list"
            aria-label="Fact-check verdicts"
          >
            {article.factCheckVerdicts!.map((verdict, idx) => (
              <FactCheckBadge key={`${verdict.publisher}-${idx}`} verdict={verdict} />
            ))}
          </div>
        )}

        {/* ── Read Original Link ── */}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="
            inline-flex items-center gap-1 text-[11px] font-medium
            text-indigo-400 hover:text-indigo-300
            transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm
          "
          aria-label={`Read full article: ${article.title} on ${article.sourceName}`}
        >
          Read original
          <svg
            className="w-3 h-3"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3.5 8.5l5-5M8.5 3.5H5M8.5 3.5v3.5"
            />
          </svg>
        </a>
      </div>
    </article>
  );
});


