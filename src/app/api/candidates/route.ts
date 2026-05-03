import { GUIDE_CANDIDATES } from '@/lib/appData';

/**
 * Candidates API - Returns seeded candidate profiles for the voting guide.
 * Data is sourced from ECI affidavits and cached locally.
 * No authentication required.
 */
export async function GET(): Promise<Response> {
  return Response.json({
    success: true,
    candidates: GUIDE_CANDIDATES,
    fetchedAt: new Date().toISOString(),
  });
}
