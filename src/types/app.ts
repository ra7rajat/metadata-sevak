/**
 * App-level types.
 * @module types/app
 */

export type DetectedLanguage = 'en' | 'hi';
export type AppLanguage = 'en' | 'hi';

export interface CandidateProfile {
  name: string;
  party: string;
  education: string;
  assets: string;
  criminalCases: string;
  source: string;
}