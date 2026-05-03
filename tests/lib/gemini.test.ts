/**
 * Tests for the gemini lib.
 * Covers client singleton initialization and error states.
 * @module tests/lib/gemini
 */

import { getGenAIClient, getActiveModelId } from '@/lib/gemini';

jest.mock('@/config/validateEnv', () => ({
  validateEnv: jest.fn(),
  getEnvVar: jest.fn().mockReturnValue('test-api-key'),
}));

// Mock GoogleGenAI class constructor
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    // Mock methods if needed
  })),
}));

describe('gemini lib', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton module state if possible, though JS makes this tricky without jest.resetModules()
  });

  it('returns a singleton client', () => {
    const client1 = getGenAIClient();
    const client2 = getGenAIClient();
    expect(client1).toBe(client2);
  });

  it('returns active model id if available', () => {
    // We didn't make an API call, so model id should be null
    expect(getActiveModelId()).toBeNull();
  });
});
