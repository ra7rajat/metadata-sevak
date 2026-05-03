/**
 * Constituency lookup types.
 * @module types/constituency
 */

import type { ToolError } from './tools.js';

export interface ConstituencyInfo {
  constituency: string;
  state: string;
  district: string;
  mpName: string;
  mlaName: string;
}

export interface ConstituencySuccess {
  success: true;
  pincode: string;
  data: ConstituencyInfo;
  source: string;
  fetchedAt: string;
}

export type ConstituencyResult = ConstituencySuccess | ToolError;