/**
 * Tests for the gemini lib.
 * Covers client singleton initialization and error states.
 * @module tests/lib/gemini
 */

import { getGenAIClient, getActiveModelId, resolveModel, resetModelCache } from '@/lib/gemini';
import type { GoogleGenAI } from '@google/genai';

jest.mock('@/config/validateEnv', () => ({
  validateEnv: jest.fn(),
  getEnvVar: jest.fn().mockReturnValue('test-api-key'),
}));

const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

describe('gemini lib', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetModelCache();
  });

  it('returns a singleton client', () => {
    const client1 = getGenAIClient();
    const client2 = getGenAIClient();
    expect(client1).toBe(client2);
  });

  it('returns active model id if available', () => {
    expect(getActiveModelId()).toBeNull();
  });

  describe('resolveModel', () => {
    it('resolves to first available model', async () => {
      mockGenerateContent.mockResolvedValueOnce({ text: 'OK' });
      
      const model = await resolveModel();
      
      expect(model).toBe('gemini-3.1-flash-lite');
      expect(getActiveModelId()).toBe('gemini-3.1-flash-lite');
    });

    it('falls back to second model if first fails', async () => {
      mockGenerateContent
        .mockRejectedValueOnce(new Error('quota exceeded'))
        .mockResolvedValueOnce({ text: 'OK' });
      
      const model = await resolveModel();
      
      expect(model).toBe('gemini-2.5-flash');
    });

    it('throws when all models fail', async () => {
      mockGenerateContent
        .mockRejectedValueOnce(new Error('quota'))
        .mockRejectedValueOnce(new Error('quota'))
        .mockRejectedValueOnce(new Error('quota'))
        .mockRejectedValueOnce(new Error('quota'))
        .mockRejectedValueOnce(new Error('quota'))
        .mockRejectedValueOnce(new Error('quota'));
      
      await expect(resolveModel()).rejects.toThrow('unavailable');
    });

    it('caches resolved model and returns it on subsequent calls', async () => {
      mockGenerateContent.mockResolvedValueOnce({ text: 'OK' });
      
      await resolveModel();
      const model = await resolveModel();
      
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(model).toBe('gemini-3.1-flash-lite');
    });

    it('handles JSON error format in response', async () => {
      mockGenerateContent.mockRejectedValueOnce(
        new Error(JSON.stringify({ error: { message: 'API key invalid', status: 'INVALID_ARGUMENT' } }))
      );
      
      await expect(resolveModel()).rejects.toThrow();
    });
  });

  describe('resetModelCache', () => {
    it('clears the active model id', async () => {
      mockGenerateContent.mockResolvedValueOnce({ text: 'OK' });
      
      await resolveModel();
      expect(getActiveModelId()).toBe('gemini-3.1-flash-lite');
      
      resetModelCache();
      expect(getActiveModelId()).toBeNull();
    });
  });
});
