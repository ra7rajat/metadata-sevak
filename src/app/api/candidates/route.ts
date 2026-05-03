import { GUIDE_CANDIDATES } from '@/lib/appData';

export async function GET(): Promise<Response> {
  return Response.json({
    success: true,
    candidates: GUIDE_CANDIDATES,
    fetchedAt: new Date().toISOString(),
  });
}
