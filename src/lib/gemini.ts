/**
 * Gemini AI client with automatic model fallback.
 * Tries models in priority order and logs which one is active.
 * @module lib/gemini
 */

import { GoogleGenAI } from '@google/genai';
import { getEnvVar } from '@/config/validateEnv';
import { GEMINI_MODELS, type GeminiModelId } from '@/types';

/** The system instruction that defines MataData's persona and behavior */
export const SYSTEM_INSTRUCTION = `You are MataData (मतदाता), an election information assistant for India. You help voters understand the election process, find their polling booth, check voter registration, and get unbiased election news. Always be neutral and factual. Support Hindi and English seamlessly.

Key guidelines:
- Provide accurate information about Indian elections, ECI (Election Commission of India) processes, and voter rights.
- Help users find their polling booth location, check voter ID status, and understand voting procedures.
- When discussing candidates or parties, remain strictly neutral and present factual information only.
- Support both Hindi and English queries. If a user writes in Hindi, respond in Hindi. If in English, respond in English. If mixed, respond in the dominant language.
- Cite official sources like ECI (eci.gov.in), NVSP (nvsp.in) when providing procedural information.
- If you don't know something or the information might be outdated, clearly state that and direct users to official sources.
- Never express political opinions or bias toward any party or candidate.
- Be helpful, concise, and respectful in all interactions.`;

/** Singleton Gemini client instance */
let genaiClient: GoogleGenAI | null = null;

/** The currently active model ID after fallback resolution */
let activeModelId: GeminiModelId | null = null;

function extractGeminiErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as {
        error?: { message?: string; status?: string };
      };
      if (parsed.error?.message) {
        return parsed.error.message;
      }
      if (parsed.error?.status) {
        return parsed.error.status;
      }
    } catch {
      return error.message;
    }

    return error.message;
  }

  return String(error);
}

/**
 * Returns the singleton GoogleGenAI client instance.
 * Creates it on first call using the GEMINI_API_KEY env var.
 *
 * @returns The initialized GoogleGenAI client.
 */
export function getGenAIClient(): GoogleGenAI {
  if (!genaiClient) {
    const apiKey = getEnvVar('GEMINI_API_KEY');
    genaiClient = new GoogleGenAI({ apiKey });
    console.log('[MataData] Gemini client initialized');
  }
  return genaiClient;
}

/**
 * Determines which Gemini model to use via auto-fallback.
 * Tries each model in GEMINI_MODELS order with a lightweight test prompt.
 * Caches the result after first successful resolution.
 *
 * @returns The model ID that successfully responded.
 * @throws {Error} If no model is available.
 */
export async function resolveModel(): Promise<GeminiModelId> {
  if (activeModelId) {
    return activeModelId;
  }

  const client = getGenAIClient();

  for (const modelId of GEMINI_MODELS) {
    try {
      console.log(`[MataData] Trying model: ${modelId}...`);
      const response = await client.models.generateContent({
        model: modelId,
        contents: 'Respond with OK',
        config: {
          maxOutputTokens: 5,
        },
      });

      if (response.text) {
        activeModelId = modelId;
        console.log(`[MataData] ✅ Active model: ${modelId}`);
        return modelId;
      }
    } catch (error) {
      const message = extractGeminiErrorMessage(error);
      console.warn(`[MataData] ⚠️ Model ${modelId} unavailable: ${message}`);
    }
  }

  throw new Error('[MataData] Gemini API is unavailable. Check your API key, enabled models, and quota/billing.');
}

/**
 * Returns the currently cached active model ID, or null if not yet resolved.
 *
 * @returns The active model ID or null.
 */
export function getActiveModelId(): GeminiModelId | null {
  return activeModelId;
}

/**
 * Resets the cached model selection. Useful for testing or when
 * a model becomes unavailable mid-session.
 */
export function resetModelCache(): void {
  activeModelId = null;
  console.log('[MataData] Model cache reset — will re-resolve on next request');
}
