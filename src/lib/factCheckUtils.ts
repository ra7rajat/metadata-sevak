/**
 * Fact check parsing utilities.
 * @module lib/factCheckUtils
 */

import type { FactCheckVerdict } from '@/types';

/**
 * Normalizes varied fact-check rating strings to standard verdicts.
 * Maps diverse publisher ratings to: TRUE, FALSE, MISSING_CONTEXT, UNVERIFIED.
 */
export function normalizeRating(rating: string): FactCheckVerdict['normalizedRating'] {
  const lower = rating.toLowerCase();

  // True / verified
  if (
    lower === 'true' ||
    lower === 'correct' ||
    lower === 'accurate' ||
    lower === 'verified' ||
    lower.includes('mostly true') ||
    lower.includes('mostly correct') ||
    lower.includes('verified')
  ) {
    return 'TRUE';
  }

  // False / incorrect
  if (
    lower === 'false' ||
    lower === 'fake' ||
    lower === 'incorrect' ||
    lower.includes('pants on fire') ||
    lower.includes('mostly false') ||
    lower.includes('completely false')
  ) {
    return 'FALSE';
  }

  // Mixed / context-dependent
  if (
    lower.includes('half true') ||
    lower.includes('misleading') ||
    lower.includes('missing context') ||
    lower.includes('partly') ||
    lower.includes('exaggerated') ||
    lower.includes('mixture')
  ) {
    return 'MISSING_CONTEXT';
  }

  return 'UNVERIFIED';
}

/**
 * Extracts potentially checkable factual claims from article text.
 * Uses heuristics to identify sentences with factual assertions.
 */
export function extractCheckableClaims(snippet: string, title: string): string[] {
  const claims: string[] = [];
  const combined = `${title}. ${snippet}`;

  const sentences = combined
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  for (const sentence of sentences) {
    if (claims.length >= 3) break;

    const hasNumbers = /\d+/.test(sentence);
    const hasPercent = /%|percent|crore|lakh|billion|million/.test(sentence.toLowerCase());
    const hasAbsolute = /first|largest|never|always|all |every |no one|highest|lowest|record/i.test(sentence);
    const hasClaimVerb = /said|claimed|stated|announced|declared|alleged/i.test(sentence);

    if (hasNumbers || hasPercent || hasAbsolute || hasClaimVerb) {
      claims.push(sentence);
    }
  }

  if (claims.length === 0 && title.length > 15) {
    claims.push(title);
  }

  return claims;
}