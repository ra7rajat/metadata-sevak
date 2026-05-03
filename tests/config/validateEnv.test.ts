/**
 * Tests for environment validation
 * @module tests/config/validateEnv
 */

// Mock process.env before importing
const mockEnv = {
  GEMINI_API_KEY: 'test-key',
  GOOGLE_API_KEY: 'test-key',
  GOOGLE_CSE_ID: 'test-id',
  MAPS_API_KEY: 'test-key',
};

Object.defineProperty(process, 'env', {
  value: { ...process.env, ...mockEnv },
  writable: true,
});

import { validateEnv, getEnvVar } from '@/config/validateEnv';
import type { RequiredEnvKey } from '@/types';

describe('config/validateEnv', () => {
  describe('validateEnv', () => {
    it('should pass when all required keys are set', () => {
      expect(() => validateEnv()).not.toThrow();
    });
  });

  describe('getEnvVar', () => {
    it('should return the value of a valid env var', () => {
      expect(getEnvVar('GEMINI_API_KEY')).toBe('test-key');
    });

    it('should throw for missing env var', () => {
      // Temporarily delete the env var
      const original = process.env.MISSING_KEY;
      delete process.env.MISSING_KEY;
      expect(() => getEnvVar('MISSING_KEY' as RequiredEnvKey)).toThrow();
      process.env.MISSING_KEY = original;
    });
  });
});