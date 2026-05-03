import NodeCache from 'node-cache';

/**
 * Cache layer - In-memory by default
 * For production Redis (Google Cloud Memorystore), update to use @google-cloud/redis
 */
const memoryCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

/**
 * Get cached value
 */
export function getCache<T>(key: string): T | null {
  return memoryCache.get<T>(key) ?? null;
}

/**
 * Set cached value with TTL (seconds)
 */
export function setCache(key: string, value: unknown, ttlSeconds = 3600): void {
  memoryCache.set(key, value, ttlSeconds);
}

/**
 * Delete a cached key
 */
export function deleteCache(key: string): void {
  memoryCache.del(key);
}

/**
 * Check if Redis is available (for future use)
 */
export function isRedisAvailable(): boolean {
  return !!process.env.REDIS_URL;
}