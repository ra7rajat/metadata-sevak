/**
 * Shared cache for news data with configurable TTL.
 *
 * Provides a singleton NodeCache instance used by the newsAggregator
 * and factChecker modules. Centralised here so both modules share
 * the same cache and avoid duplicate fetches for the same queries.
 *
 * @module lib/newsCache
 */

import NodeCache from 'node-cache';

/** News cache: 15-minute TTL, expiry check every 2 minutes */
const newsCache = new NodeCache({ stdTTL: 900, checkperiod: 120 });

/**
 * Returns the shared news cache instance.
 *
 * @returns The singleton NodeCache instance for news data.
 */
export function getNewsCache(): NodeCache {
  return newsCache;
}

/**
 * Generates a deterministic cache key from a prefix and parameters.
 * Lowercases and trims all values for consistent cache hits.
 *
 * @param prefix - Cache namespace (e.g., "news", "factcheck").
 * @param params - Key-value pairs to include in the cache key.
 * @returns A deterministic cache key string.
 */
export function buildCacheKey(
  prefix: string,
  params: Record<string, string>
): string {
  const parts = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v.toLowerCase().trim()}`)
    .join(':');
  return `${prefix}:${parts}`;
}
