import path from 'node:path';
import type { NextConfig } from 'next';

/**
 * Next.js configuration for the MataData election assistant.
 * Includes security headers and environment validation.
 */
const nextConfig: NextConfig = {
  /** Enforce strict React patterns */
  reactStrictMode: true,
  /** Enable gzip compression for responses */
  compress: true,
  /** Allow external images for favicons */
  images: {
    remotePatterns: [
      { hostname: 'www.google.com', protocol: 'https' },
      { hostname: 'news.google.com', protocol: 'https' },
      { hostname: '*.google.com', protocol: 'https' },
    ],
  },

  /**
   * Keep Turbopack scoped to this app directory.
   * This avoids watching the parent folder when multiple lockfiles exist.
   */
  turbopack: {
    root: path.resolve(__dirname),
  },

  /** Security & performance headers */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
           {
             key: 'Referrer-Policy',
             value: 'strict-origin-when-cross-origin',
           },
           {
             key: 'Strict-Transport-Security',
             value: 'max-age=63072000; includeSubDomains; preload',
           },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=(self)', // allow microphone for voice
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://www.google.com https://maps.googleapis.com; connect-src 'self' wss: https://factchecktools.googleapis.com https://news.google.com; media-src 'self' blob:;",
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_APP_URL || 'https://*.run.app',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
