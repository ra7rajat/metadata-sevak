'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/components/providers/LanguageProvider';
import type { NewsArticle, NewsSource } from '@/types';

interface NewsResponse {
  success: boolean;
  topic?: string;
  sources?: NewsSource[];
  totalArticles?: number;
  fetchedAt?: string;
  error?: string;
}

interface SummaryResponse {
  agreedFacts: string[];
  differingAngles: string[];
  summary: string;
}

function timeAgo(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

export default function NewsSection() {
  const { language, setLanguage } = useLanguage();
  const [topic, setTopic] = useState('India election 2026');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [result, setResult] = useState<NewsResponse | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);

  const copy = useMemo(() => ({
    heading: language === 'hi' ? 'चुनावी समाचार' : 'Election News',
    search: language === 'hi' ? 'चुनावी विषय खोजें...' : 'Search election topic...',
    refresh: language === 'hi' ? 'ताज़ा करें' : 'Refresh',
    more: language === 'hi' ? 'और स्रोत' : 'More sources',
    agree: language === 'hi' ? '✅ दोनों स्रोत सहमत हैं:' : '✅ Both sources agree:',
    differ: language === 'hi' ? '⚡ वे अलग हैं:' : '⚡ They differ on:',
  }), [language]);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/news?topic=${encodeURIComponent(topic)}&lang=${language}`);
      const data = await response.json() as NewsResponse;
      setResult(data);

      const leftArticle = data.sources?.[0]?.articles?.[0];
      const rightArticle = data.sources?.[1]?.articles?.[0];
      if (leftArticle && rightArticle) {
        const summaryResponse = await fetch('/api/news/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leftArticle, rightArticle }),
        });
        setSummary(await summaryResponse.json() as SummaryResponse);
      } else {
        setSummary(null);
      }
    } finally {
      setLoading(false);
    }
  }, [language, topic]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchNews();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchNews]);

  const leftArticle = result?.sources?.[0]?.articles?.[0];
  const rightArticle = result?.sources?.[1]?.articles?.[0];
  const moreSources = result?.sources?.slice(2) || [];

  return (
    <section className="py-8 md:py-12 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-300">News</p>
          <h2 className="text-3xl md:text-4xl font-semibold text-white">{copy.heading}</h2>
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder={copy.search}
            className="w-full md:w-80 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
          />
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setLanguage('en')} className={`rounded-full px-3 py-2 text-sm ${language === 'en' ? 'bg-white text-black' : 'bg-white/5 text-gray-300'}`}>EN</button>
            <button type="button" onClick={() => setLanguage('hi')} className={`rounded-full px-3 py-2 text-sm ${language === 'hi' ? 'bg-white text-black' : 'bg-white/5 text-gray-300'}`}>हिं</button>
            <button type="button" onClick={() => void fetchNews()} className="rounded-full bg-gradient-to-r from-orange-500 to-green-600 px-4 py-2 text-sm text-white">
              {copy.refresh}
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="grid gap-4 lg:grid-cols-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-[28px] border border-white/10 bg-white/5 p-5 min-h-[340px]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10" />
                <div className="space-y-2">
                  <div className="h-4 w-24 rounded bg-white/10" />
                  <div className="h-3 w-16 rounded bg-white/10" />
                </div>
              </div>
              <div className="mt-5 h-6 w-full rounded bg-white/10" />
              <div className="mt-3 space-y-2">
                <div className="h-4 w-full rounded bg-white/10" />
                <div className="h-4 w-3/4 rounded bg-white/10" />
              </div>
              <div className="mt-4 h-6 w-24 rounded-full bg-white/10" />
              <div className="mt-5 h-4 w-32 rounded bg-white/10" />
            </div>
          ))}
        </div>
      )}

      {!loading && result?.success && leftArticle && rightArticle && (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <ArticleCard article={leftArticle} />
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 md:p-6">
              <p className="text-sm font-semibold text-emerald-300">{copy.agree}</p>
              <ul className="mt-3 space-y-2 text-sm text-gray-200">
                {(summary?.agreedFacts || []).map((fact) => <li key={fact}>• {fact}</li>)}
              </ul>
              <p className="mt-5 text-sm font-semibold text-amber-300">{copy.differ}</p>
              <ul className="mt-3 space-y-2 text-sm text-gray-200">
                {(summary?.differingAngles || []).map((fact) => <li key={fact}>• {fact}</li>)}
              </ul>
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Neutral Summary</p>
                <p className="mt-2 text-sm text-gray-200">{summary?.summary || 'Summary unavailable.'}</p>
              </div>
            </div>
            <ArticleCard article={rightArticle} />
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <button type="button" onClick={() => setExpanded((value) => !value)} className="text-sm font-medium text-white">
              {copy.more} {expanded ? '−' : '+'}
            </button>
            {expanded && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {moreSources.flatMap((source) => source.articles).map((article) => (
                  <ArticleCard key={article.url} article={article} compact />
                ))}
              </div>
            )}
            <p className="mt-4 text-xs text-gray-500">
              {result.fetchedAt ? `Last updated ${timeAgo(result.fetchedAt)}` : ''}
            </p>
          </div>
        </>
      )}

      {!loading && result && !result.success && (
        <div className="rounded-[28px] border border-red-500/20 bg-red-500/10 p-5 text-red-100">
          {result.error}
        </div>
      )}
    </section>
  );
}

function ArticleCard({ article, compact = false }: { article: NewsArticle; compact?: boolean }) {
  const verdict = article.factCheckVerdicts?.[0];
  const badge = verdict?.normalizedRating === 'TRUE'
    ? 'green'
    : verdict?.normalizedRating === 'FALSE'
      ? 'red'
      : 'yellow';

  return (
    <article className={`rounded-[28px] border border-white/10 bg-white/5 p-5 ${compact ? '' : 'min-h-[340px]'}`}>
      <div className="flex items-center gap-3">
        <Image src={article.faviconUrl} alt="" width={32} height={32} className="rounded-full bg-white" />
        <div>
          <p className="text-sm text-white">{article.sourceName}</p>
          <p className="text-xs text-gray-500">{timeAgo(article.publishedAt)}</p>
        </div>
      </div>
      <h3 className="mt-5 text-xl font-semibold text-white">{article.title}</h3>
      <p className="mt-3 text-sm leading-7 text-gray-300">{article.snippet}</p>
      {verdict && (
        <div className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs ${
          badge === 'green' ? 'bg-emerald-500/20 text-emerald-200' : badge === 'red' ? 'bg-red-500/20 text-red-200' : 'bg-amber-500/20 text-amber-200'
        }`}>
          {badge === 'green' ? '✓ VERIFIED' : badge === 'red' ? '✗ FALSE' : '⚠ CONTEXT'}
        </div>
      )}
      <a href={article.url} target="_blank" rel="noreferrer" className="mt-5 inline-flex text-sm text-indigo-300 underline">
        Read original ↗
      </a>
    </article>
  );
}
