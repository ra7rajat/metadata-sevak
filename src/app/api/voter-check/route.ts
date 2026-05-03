import { NextRequest } from 'next/server';
import { searchVoterRoll, findPollingBooth } from '@/tools';

/**
 * Voter Check API - Searches electoral roll by name/district or EPIC.
 * 
 * Query params (method=epic):
 * - epic: EPIC number to find polling booth
 * 
 * Query params (default):
 * - name: Voter name
 * - state: State name
 * - district: District name
 * 
 * Returns voter records from ECI database.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const params = request.nextUrl.searchParams;
  const method = params.get('method');

  if (method === 'epic') {
    const epic = params.get('epic') || '';
    const booth = await findPollingBooth(epic);
    return Response.json(booth);
  }

  const name = params.get('name') || '';
  const state = params.get('state') || '';
  const district = params.get('district') || '';

  const voter = await searchVoterRoll(name, state, district);
  if (!voter.success) {
    return Response.json(voter);
  }

  const firstRecord = voter.records[0];
  const booth = firstRecord?.epicNumber
    ? await findPollingBooth(firstRecord.epicNumber)
    : null;

  return Response.json({
    ...voter,
    booth,
  });
}
