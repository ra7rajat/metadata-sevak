/**
 * Tool execution types.
 * @module types/tools
 */

import type {
  VoterRollResult,
  ElectionScheduleResult,
} from './voter';
import type { ConstituencyResult } from './constituency';
import type { PollingBoothResult } from './booth';
import type { MultiSourceNewsResult, ClaimCheckResult } from './news';

export interface ToolError {
  success: false;
  error: string;
  code: 'NETWORK_ERROR' | 'NOT_FOUND' | 'INVALID_INPUT' | 'RATE_LIMITED' | 'UNAVAILABLE';
}

export interface ToolExecutionResult {
  toolName: string;
  result:
    | VoterRollResult
    | ElectionScheduleResult
    | ConstituencyResult
    | PollingBoothResult
    | MultiSourceNewsResult
    | ClaimCheckResult;
}