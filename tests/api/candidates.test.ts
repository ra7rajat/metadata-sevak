/**
 * Tests for candidates API route.
 * @module tests/api/candidates
 */

import { GET } from '@/app/api/candidates/route';

describe('/api/candidates', () => {
  it('returns seeded candidate data', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.candidates.length).toBeGreaterThan(0);
    expect(data.candidates[0].source).toContain('ECI Affidavit');
  });
});
