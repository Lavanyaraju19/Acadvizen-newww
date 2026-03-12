// Environment variables must be set in .env.local (local dev)
// or Vercel → Project Settings → Environment Variables (production).
export function getEnv(key: string, fallback = '') {
  const value = process.env[key]
  if (!value) return fallback
  return value
}

// Keep NEXT_PUBLIC values as direct literals so Next.js can inline them on the client.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Server-only key. Access via getEnv in server context to avoid client warnings.
export const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY')
