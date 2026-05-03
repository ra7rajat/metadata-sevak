/**
 * Chat API route handler with streaming responses, input sanitization,
 * and per-IP rate limiting.
 *
 * Uses the election agent (Gemini function calling) to provide
 * tool-augmented responses for election queries.
 *
 * @module api/chat
 */

import { NextRequest } from 'next/server';
import { runElectionAgent } from '@/agent/electionAgent';
import { validateEnv } from '@/config/validateEnv';
import { validateChatRequest } from '@/lib/validators';
import { logger } from '@/lib/logger';
import type { RateLimitEntry, ConversationTurn } from '@/types';

// ─── Rate Limiting ──────────────────────────────────────────────────────────

/** In-memory rate limit store (per-IP) */
const rateLimitMap = new Map<string, RateLimitEntry>();

/** Maximum requests allowed per window */
const RATE_LIMIT_MAX = 20;

/** Rate limit window duration in milliseconds (1 minute) */
const RATE_LIMIT_WINDOW_MS = 60_000;

/**
 * Checks whether the given IP has exceeded the rate limit.
 *
 * @param ip - The client IP address.
 * @returns `true` if the request should be blocked.
 */
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

// ─── Input Sanitization ─────────────────────────────────────────────────────

  /** Maximum allowed message length in characters */
  const MAX_MESSAGE_LENGTH = 2000;

/**
 * Sanitizes user input to prevent prompt injection and abuse.
 * Strips control characters, excessive whitespace, and HTML tags.
 *
 * @param input - Raw user message string.
 * @returns Sanitized message string.
 */
function sanitizeInput(input: string): string {
  let sanitized = input
    // Strip HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove control characters (keep newlines and tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Collapse excessive whitespace
    .replace(/\s{3,}/g, '  ')
    // Trim
    .trim();

  // Truncate to max length
  if (sanitized.length > MAX_MESSAGE_LENGTH) {
    sanitized = sanitized.slice(0, MAX_MESSAGE_LENGTH);
  }

  return sanitized;
}

function formatApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Internal server error';
}

// ─── Route Handler ──────────────────────────────────────────────────────────

/**
 * POST /api/chat
 *
 * Accepts a user message and optional conversation history,
 * routes through the election agent (Gemini function calling),
 * and streams the response word by word.
 *
 * The agent may invoke tools (voter roll search, constituency lookup,
 * polling booth finder) before generating the final response.
 *
 * @param request - The incoming Next.js request.
 * @returns A streaming Response with the agent's text.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Validate environment on first request
    validateEnv();

    // ── Rate Limiting ──
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';

    if (isRateLimited(ip)) {
      return Response.json(
        {
          error: 'Rate limit exceeded. Maximum 20 requests per minute.',
          retryAfterSeconds: 60,
        },
        { status: 429 }
      );
    }

    // ── Parse & Validate Body ──
    let rawBody;
    try {
      rawBody = await request.json();
    } catch {
      return Response.json(
        { error: 'Invalid JSON in request body.' },
        { status: 400 }
      );
    }

    let validatedBody;
    try {
      validatedBody = validateChatRequest(rawBody);
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : 'Validation failed' },
        { status: 400 }
      );
    }

    const sanitizedMessage = sanitizeInput(validatedBody.message);

    if (sanitizedMessage.length === 0) {
      return Response.json(
        { error: 'Message is empty after sanitization.' },
        { status: 400 }
      );
    }

    const body = validatedBody;

    // ── Build History ──
    const history: ConversationTurn[] = [];

    if (body.history && Array.isArray(body.history)) {
      const historyItems = body.history as Array<{ role?: string; parts?: Array<{ text?: string }> }>;
      for (const turn of historyItems) {
        if (
          turn.role &&
          (turn.role === 'user' || turn.role === 'model') &&
          turn.parts &&
          Array.isArray(turn.parts)
        ) {
          history.push({
            role: turn.role as 'user' | 'model',
            parts: (turn.parts as Array<{ text?: string }>)
              .filter((p) => typeof p.text === 'string')
              .map((p) => ({ text: sanitizeInput(p.text as string) })),
          });
        }
      }
    }

    // ── Run Agent & Stream Response ──
    const stream = await runElectionAgent(sanitizedMessage, history);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'Transfer-Encoding': 'chunked',
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://*.run.app',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  } catch (error) {
    const message = formatApiError(error);
    logger.error('Chat API error', { error: message, endpoint: '/api/chat' });
    return Response.json({ error: message }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://*.run.app',
      }
    });
  }
}
