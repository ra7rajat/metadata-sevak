/**
 * Voter and election types.
 * @module types/voter
 */

import type { ToolError } from './tools';

export interface VoterRecord {
  name: string;
  relativeName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  epicNumber: string;
  pollingStation: string;
  constituency: string;
}

export interface VoterRollSuccess {
  success: true;
  totalResults: number;
  records: VoterRecord[];
  source: string;
  fetchedAt: string;
}

export type VoterRollResult = VoterRollSuccess | ToolError;

export interface ElectionEvent {
  electionType: string;
  phase?: number;
  pollingDate: string;
  constituencies: string[];
  resultDate?: string;
  status: 'Scheduled' | 'Ongoing' | 'Completed';
}

export interface ElectionScheduleSuccess {
  success: true;
  state: string;
  events: ElectionEvent[];
  source: string;
  fetchedAt: string;
}

export type ElectionScheduleResult = ElectionScheduleSuccess | ToolError;