/**
 * Tool barrel export — re-exports all tool functions from a single entry point.
 *
 * This allows the agent layer to import all tools with:
 * ```ts
 * import { searchVoterRoll, fetchMultiSourceNews, checkClaim } from '@/tools';
 * ```
 *
 * @module tools
 */

export { searchVoterRoll, getElectionSchedule } from './eciScraper';
export { pincodeToConstituency } from './constituencyLookup';
export { findPollingBooth, getBoothMapUrl, getBoothDirectionsUrl } from './pollingBooth';
export { fetchElectionNews, fetchMultiSourceNews } from './newsAggregator';
export { checkClaim, scanNewsForClaims } from './factChecker';
