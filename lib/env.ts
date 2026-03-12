// Environment variables should be configured in .env.local (local dev)
// or in hosting project settings (production).
export function getEnv(key: string, fallback = '') {
  const value = process.env[key]
  if (!value) return fallback
  return value
}

// Public fallback values for local reliability.
// These values are safe on client side because they are Supabase public credentials.
const PUBLIC_SUPABASE_URL_FALLBACK = 'https://hhfccftkfryesjirauwf.supabase.co'
const PUBLIC_SUPABASE_ANON_KEY_FALLBACK =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZmNjZnRrZnJ5ZXNqaXJhdXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDU2MDIsImV4cCI6MjA4NTUyMTYwMn0.fQEn6NHCktUeifsNErfB0XBc5bHKKxYLXBBdxx3EqP0'

// Keep NEXT_PUBLIC values as literals so Next.js can inline them on the client.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || PUBLIC_SUPABASE_URL_FALLBACK
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  PUBLIC_SUPABASE_ANON_KEY_FALLBACK

// Server-only key. Access via getEnv in server context to avoid client warnings.
export const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY')
