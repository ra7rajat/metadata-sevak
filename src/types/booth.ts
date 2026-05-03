/**
 * Polling booth types.
 * @module types/booth
 */

import type { ToolError } from './tools';

export interface PollingBoothInfo {
  boothNumber: string;
  boothName: string;
  address: string;
  constituency: string;
  district: string;
  state: string;
  mapImageUrl?: string;
  directionsUrl?: string;
}

export interface PollingBoothSuccess {
  success: true;
  epicNumber: string;
  booth: PollingBoothInfo;
  source: string;
  fetchedAt: string;
}

export type PollingBoothResult = PollingBoothSuccess | ToolError;