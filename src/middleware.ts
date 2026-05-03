import { NextRequest, NextResponse } from 'next/server';

/**
 * In-memory rate limit store (alternatively use Redis for production)
 * Maps IP to { count: number, windowStart: number }
 */
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

/**
 * Middleware to apply security headers and rate limiting to all API routes
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to /api routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Rate limiting
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();

  const entry = rateLimitStore.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
  } else {
    entry.count += 1;
    if (entry.count > RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  // Security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://maps.googleapis.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://maps.googleapis.com; connect-src 'self' https://generativelanguage.googleapis.com https://factchecktools.googleapis.com https://news.google.com"
  );
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
