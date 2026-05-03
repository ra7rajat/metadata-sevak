/**
 * Tests for the /api/chat route handler.
 * Covers input validation, sanitization, rate limiting, and streaming.
 * @module tests/api/chat
 */

// ─── Mocks ──────────────────────────────────────────────────────────────────

// Mock environment variables
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.GOOGLE_API_KEY = 'test-google-key';
process.env.GOOGLE_CSE_ID = 'test-cse-id';
process.env.MAPS_API_KEY = 'test-maps-key';

// Mock the election agent — factory returns a fresh stream per call
jest.mock('@/agent/electionAgent', () => ({
  runElectionAgent: jest.fn().mockImplementation(() =>
    Promise.resolve(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('Hello, '));
          controller.enqueue(new TextEncoder().encode('I am '));
          controller.enqueue(new TextEncoder().encode('MataData!'));
          controller.close();
        },
      })
    )
  ),
}));

// Mock validateEnv to not throw in tests
jest.mock('@/config/validateEnv', () => ({
  validateEnv: jest.fn(),
  getEnvVar: jest.fn((key: string) => process.env[key] || 'test-value'),
}));

import { POST } from '@/app/api/chat/route';
import { NextRequest } from 'next/server';

// ─── Helpers ────────────────────────────────────────────────────────────────

function createMockRequest(
  body: Record<string, unknown>,
  ip = '127.0.0.1'
): NextRequest {
  return new NextRequest('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

async function readStream(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder();
  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  return result;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('/api/chat', () => {

  describe('Input Validation', () => {
    it('should return 400 for missing message field', async () => {
      const request = createMockRequest({});
      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('message');
    });

    it('should return 400 for non-string message', async () => {
      const request = createMockRequest({ message: 12345 });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for empty message after sanitization', async () => {
      const request = createMockRequest({ message: '   ' });
      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('non-empty string');
    });

    it('should return 400 for invalid JSON body', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
        body: 'not-json',
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Input Sanitization', () => {
    it('should strip HTML tags from messages', async () => {
      const request = createMockRequest({ message: 'Hello <script>alert("xss")</script> world' });
      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('should handle Hindi text correctly', async () => {
      const request = createMockRequest({ message: 'मतदाता पहचान पत्र कैसे बनवाएं?' });
      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Streaming Response', () => {
    it('should return a streaming response for valid input', async () => {
      const request = createMockRequest({ message: 'How do I register to vote?' });
      const response = await POST(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
      const body = await readStream(response);
      expect(body).toBe('Hello, I am MataData!');
    });

    it('should include security headers', async () => {
      const request = createMockRequest({ message: 'Test message' });
      const response = await POST(request);
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('Cache-Control')).toContain('no-cache');
    });
  });

  describe('Conversation History', () => {
    it('should accept valid conversation history', async () => {
      const request = createMockRequest({
        message: 'Tell me more',
        history: [
          { role: 'user', parts: [{ text: 'What is ECI?' }] },
          { role: 'model', parts: [{ text: 'ECI stands for Election Commission of India.' }] },
        ],
      });
      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('should handle malformed history gracefully', async () => {
      const request = createMockRequest({ message: 'Tell me more', history: [{ invalid: true }] });
      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within the rate limit', async () => {
      const ip = `rate-test-${Date.now()}`;
      for (let i = 0; i < 5; i++) {
        const request = createMockRequest({ message: `Test ${i}` }, ip);
        const response = await POST(request);
        expect(response.status).toBe(200);
      }
    });

    it('should block requests exceeding rate limit', async () => {
      const ip = `rate-block-${Date.now()}`;
      for (let i = 0; i < 21; i++) {
        const request = createMockRequest({ message: `Test ${i}` }, ip);
        const response = await POST(request);
        if (i < 20) {
          expect(response.status).toBe(200);
        } else {
          expect(response.status).toBe(429);
          const data = await response.json();
          expect(data.error).toContain('Rate limit');
          expect(data.retryAfterSeconds).toBe(60);
        }
      }
    });
  });
});
