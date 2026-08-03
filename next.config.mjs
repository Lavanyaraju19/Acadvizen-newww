import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// The CSP below hardcodes https://*.supabase.co, which matches every real production
// Supabase project. It does NOT match a disposable/local Supabase instance (e.g.
// http://127.0.0.1:54321) used for safe destructive E2E testing, which silently blocks
// the browser's own auth session calls (getSession/getUser/refreshSession) and produces a
// false "Admin session expired" error. Derive the actual configured origin so local/disposable
// testing works without loosening the policy for production, where this is just a harmless
// duplicate of the wildcard rule already in place.
const configuredSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
let configuredSupabaseOrigin = ''
try {
  configuredSupabaseOrigin = configuredSupabaseUrl ? new URL(configuredSupabaseUrl).origin : ''
} catch {
  configuredSupabaseOrigin = ''
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  skipMiddlewareUrlNormalize: true,
  outputFileTracingRoot: __dirname,
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'logo.clearbit.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.vercel-insights.com https://www.googletagmanager.com https://connect.facebook.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://*.supabase.co https://logo.clearbit.com https://images.unsplash.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://www.googletagmanager.com https://www.google-analytics.com https://www.facebook.com",
              "font-src 'self' https://fonts.gstatic.com",
              [
                "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
                configuredSupabaseOrigin,
                "https://*.vercel-insights.com https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://connect.facebook.net https://www.facebook.com",
              ].filter(Boolean).join(' '),
              "frame-src 'self' https://*.supabase.co https://www.googletagmanager.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ]
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-router-dom': path.resolve(__dirname, 'src/lib/react-router-dom-shim.js'),
    }
    return config
  },
}

export default nextConfig
