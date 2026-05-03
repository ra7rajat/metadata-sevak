/**
 * Tests for health API route.
 * @module tests/api/health
 */

import { GET } from '@/app/api/health/route';

jest.mock('@/lib/gemini', () => ({
  getActiveModelId: jest.fn().mockReturnValue('test-model'),
}));

describe('Health API Route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns healthy status when all services configured', async () => {
    process.env.GEMINI_API_KEY = 'test';
    process.env.GOOGLE_API_KEY = 'test';
    process.env.GOOGLE_CSE_ID = 'test';
    process.env.MAPS_API_KEY = 'test';

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.services.gemini.available).toBe(true);
  });

  it('returns degraded status when some services are missing', async () => {
    process.env.GEMINI_API_KEY = 'test';
    delete process.env.GOOGLE_API_KEY;

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('degraded');
  });

  it('returns unhealthy status when all services are down', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GOOGLE_CSE_ID;
    delete process.env.MAPS_API_KEY;

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('unhealthy');
  });
});
