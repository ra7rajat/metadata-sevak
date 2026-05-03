import type { CandidateProfile } from '@/types';

export const INDIA_STATES = [
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh', districts: ['Lucknow', 'Varanasi', 'Kanpur Nagar', 'Prayagraj'] },
  { value: 'Delhi', label: 'Delhi', districts: ['New Delhi', 'North Delhi', 'South Delhi', 'West Delhi'] },
  { value: 'Maharashtra', label: 'Maharashtra', districts: ['Mumbai', 'Pune', 'Nagpur', 'Nashik'] },
  { value: 'Karnataka', label: 'Karnataka', districts: ['Bangalore Urban', 'Mysore', 'Mangalore', 'Belagavi'] },
  { value: 'Tamil Nadu', label: 'Tamil Nadu', districts: ['Chennai', 'Coimbatore', 'Madurai', 'Salem'] },
  { value: 'Bihar', label: 'Bihar', districts: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur'] },
] as const;

export const GUIDE_CANDIDATES: CandidateProfile[] = [
  {
    name: 'Ananya Rao',
    party: 'Independent',
    education: 'MBA, University of Mysore',
    assets: 'INR 1.8 crore declared',
    criminalCases: 'No criminal cases declared',
    source: 'Source: ECI Affidavit',
  },
  {
    name: 'Rohit Sharma',
    party: 'Jan Pragati Party',
    education: 'B.Tech, IIT Kanpur',
    assets: 'INR 2.4 crore declared',
    criminalCases: '1 pending case disclosed in affidavit',
    source: 'Source: ECI Affidavit',
  },
  {
    name: 'Farah Siddiqui',
    party: 'Lok Vikas Dal',
    education: 'LLB, Delhi University',
    assets: 'INR 94 lakh declared',
    criminalCases: 'No criminal cases declared',
    source: 'Source: ECI Affidavit',
  },
] as const;

export const ACCEPTED_IDS = [
  'EPIC / Voter ID',
  'Aadhaar',
  'Passport',
  'Driving Licence',
  'PAN Card',
  'MNREGA Job Card',
] as const;
