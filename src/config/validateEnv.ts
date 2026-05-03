/**
 * Environment variable validation module.
 * Ensures all required API keys are present at startup.
 * @module config/validateEnv
 */

import type { RequiredEnvKey } from '@/types';

/** All environment variables that must be set for the app to function */
const REQUIRED_KEYS: readonly RequiredEnvKey[] = [
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
  'GOOGLE_CSE_ID',
  'MAPS_API_KEY',
] as const;

/**
 * Validates that all required environment variables are present and non-empty.
 * Should be called during application initialization.
 *
 * @throws {Error} If any required environment variable is missing or empty.
 *                 The error message lists all missing keys for easy debugging.
 *
 * @example
 * ```ts
 * // Call at app startup
 * validateEnv();
 * ```
 */
export function validateEnv(): void {
  const missing: string[] = [];

  for (const key of REQUIRED_KEYS) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n` +
        missing.map((k) => `  • ${k}`).join('\n') +
        `\n\nPlease add them to your .env.local file. See .env.example for reference.`
    );
  }
}

/**
 * Safely retrieves a validated environment variable.
 *
 * @param key - The environment variable name to retrieve.
 * @returns The value of the environment variable.
 * @throws {Error} If the variable is not set or empty.
 */
export function getEnvVar(key: RequiredEnvKey): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(
      `Environment variable ${key} is not set. Please add it to .env.local`
    );
  }
  return value;
}
