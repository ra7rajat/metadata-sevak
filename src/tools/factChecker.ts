/**
 * Fact Checker — Verifies claims using the Google Fact Check Tools API
 * and annotates news articles with verification verdicts.
 *
 * Two main functions:
 * - checkClaim: Verifies a single claim against the fact-check database
 * - scanNewsForClaims: Extracts checkable claims from articles and
 *   cross-references each with the Fact Check API
 *
 * Uses GOOGLE_API_KEY from process.env for API authentication.
 *
 * @module tools/factChecker
 */

/**
 * GOOGLE SERVICE: Google Fact Check Tools API
 * PURPOSE: Scans news claims against a global database of fact-checked statements to combat election misinformation.
 * ALTERNATIVES CONSIDERED: Manually curating fact-checks (unscalable) or relying solely on LLM knowledge (prone to hallucination on breaking news).
 * API DOCS: https://developers.google.com/fact-check/tools/api
 */

import { getNewsCache, buildCacheKey } from '@/lib/newsCache';
import { getEnvVar } from '@/config/validateEnv';
import { normalizeRating, extractCheckableClaims } from '@/lib/factCheckUtils';
import type {
  ClaimCheckResult,
  FactCheckVerdict,
  NewsArticle,
  AnnotatedArticle,
  ScanResult,
} from '@/types';

// ─── Constants ──────────────────────────────────────────────────────────────

/** Google Fact Check Tools API endpoint */
const FACT_CHECK_API_URL =
  'https://factchecktools.googleapis.com/v1alpha1/claims:search';

// ─── Fact Check API Types (internal) ────────────────────────────────────────

/** Shape of a single claim review from the Google API */
interface GoogleClaimReview {
  publisher?: { name?: string; site?: string };
  url?: string;
  title?: string;
  textualRating?: string;
  languageCode?: string;
}

/** Shape of a claim result from the Google API */
interface GoogleClaimResult {
  text?: string;
  claimant?: string;
  claimReview?: GoogleClaimReview[];
}

/** Shape of the Google Fact Check API response */
interface GoogleFactCheckResponse {
  claims?: GoogleClaimResult[];
}

// ─── Single Claim Checker ───────────────────────────────────────────────────

/**
 * Verifies a single claim using the Google Fact Check Tools API.
 *
 * Sends the claim text as a query, parses the response into structured
 * verdicts with normalized ratings for badge display.
 *
 * Results are cached for 15 minutes via the shared news cache.
 *
 * @param claim - The claim text to fact-check (e.g., "EVM machines can be hacked").
 * @returns Typed result with verdicts from fact-checking organizations.
 *
 * @example
 * ```ts
 * const result = await checkClaim("India has the largest number of voters");
 * if (result.success) {
 *   result.verdicts.forEach(v => console.log(v.publisher, v.rating));
 * }
 * ```
 */
export async function checkClaim(claim: string): Promise<ClaimCheckResult> {
  if (!claim || claim.trim().length < 5) {
    return {
      success: false,
      error: 'Claim must be at least 5 characters long.',
      code: 'INVALID_INPUT',
    };
  }

  const trimmedClaim = claim.trim();

  // Check cache
  const cacheKey = buildCacheKey('factcheck', { claim: trimmedClaim });
  const cache = getNewsCache();
  const cached = cache.get<ClaimCheckResult>(cacheKey);
  if (cached) {
    console.log(`[FactChecker] Cache hit: ${cacheKey}`);
    return cached;
  }
  console.log(`[FactChecker] Cache miss: ${cacheKey}`);

  const apiKey = getEnvVar('GOOGLE_API_KEY');
  if (!apiKey) {
    return {
      success: false,
      error: 'GOOGLE_API_KEY not configured for fact checking.',
      code: 'UNAVAILABLE',
    };
  }

  try {
    const encodedQuery = encodeURIComponent(trimmedClaim);
    const url = `${FACT_CHECK_API_URL}?query=${encodedQuery}&key=${apiKey}&languageCode=en`;

    console.log(`[FactChecker] Checking claim: "${trimmedClaim.slice(0, 60)}..."`);

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return {
          success: false,
          error: 'Fact Check API rate limit reached.',
          code: 'RATE_LIMITED',
        };
      }
      console.warn(`[FactChecker] API returned status ${response.status}`);
      return {
        success: false,
        error: `Fact Check API returned status ${response.status}.`,
        code: 'NETWORK_ERROR',
      };
    }

    const data: GoogleFactCheckResponse = await response.json();
    const verdicts = parseFactCheckResponse(data);

    const result: ClaimCheckResult = {
      success: true,
      claim: trimmedClaim,
      verdicts,
      checkedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    if (msg.includes('timeout') || msg.includes('abort')) {
      return {
        success: false,
        error: 'Fact Check API timed out.',
        code: 'NETWORK_ERROR',
      };
    }

    console.error(`[FactChecker] Check failed: ${msg}`);
    return {
      success: false,
      error: `Fact check failed: ${msg}`,
      code: 'NETWORK_ERROR',
    };
  }
}

// ─── Article Scanner ────────────────────────────────────────────────────────

/**
 * Scans an array of news articles for checkable claims and
 * cross-references each with the Google Fact Check API.
 *
 * For each article, it:
 * 1. Extracts potential factual claims from the snippet
 * 2. Runs checkClaim on each extracted claim
 * 3. Annotates the article with verdicts
 *
 * @param articles - Array of news articles to scan.
 * @returns ScanResult with all articles annotated with fact-check data.
 */
export async function scanNewsForClaims(
  articles: NewsArticle[]
): Promise<ScanResult> {
  const annotatedArticles: AnnotatedArticle[] = [];
  let articlesWithVerdicts = 0;

  for (const article of articles) {
    const claims = extractCheckableClaims(article.snippet, article.title);
    const claimResults: ClaimCheckResult[] = [];

    for (const claimText of claims) {
      const result = await checkClaim(claimText);
      claimResults.push(result);
    }

    // Collect all verdicts from successful claim checks
    const allVerdicts: FactCheckVerdict[] = claimResults
      .filter((r): r is Extract<ClaimCheckResult, { success: true }> => r.success)
      .flatMap((r) => r.verdicts);

    if (allVerdicts.length > 0) {
      articlesWithVerdicts++;
    }

    annotatedArticles.push({
      ...article,
      factCheckVerdicts: allVerdicts.length > 0 ? allVerdicts : undefined,
      extractedClaims: claims,
      claimResults,
    });
  }

  return {
    totalScanned: articles.length,
    articlesWithVerdicts,
    annotatedArticles,
    scannedAt: new Date().toISOString(),
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Parses the Google Fact Check API response into structured verdicts.
 */
function parseFactCheckResponse(data: GoogleFactCheckResponse): FactCheckVerdict[] {
  if (!data.claims || data.claims.length === 0) {
    return [];
  }

  const verdicts: FactCheckVerdict[] = [];

  for (const claim of data.claims) {
    if (!claim.claimReview) continue;

    for (const review of claim.claimReview) {
      verdicts.push({
        publisher: review.publisher?.name || review.publisher?.site || 'Unknown',
        rating: review.textualRating || 'Unrated',
        normalizedRating: normalizeRating(review.textualRating || ''),
        url: review.url || '',
      });
    }
  }

return verdicts;
}
