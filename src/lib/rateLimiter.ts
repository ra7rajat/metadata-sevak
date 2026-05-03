/**
 * Rate limiter utility for external API calls.
 * Prevents overwhelming government/paid APIs with delays.
 * @module lib/rateLimiter
 */

let lastRequestTime = 0;
const delayMs: number = 2000;

export interface RateLimiterOptions {
  delayMs?: number;
}

/**
 * Enforces a delay between consecutive API requests.
 * @param options - Optional configuration
 */
export async function rateLimit(options: RateLimiterOptions = {}): Promise<void> {
  const delay = options.delayMs ?? delayMs;
  const now = Date.now();
  const elapsed = now - lastRequestTime;

  if (elapsed < delay) {
    const waitTime = delay - elapsed;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}

/**
 * Resets the rate limiter (useful for testing).
 */
export function resetRateLimiter(): void {
  lastRequestTime = 0;
}