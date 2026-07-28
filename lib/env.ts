// Environment variables should be configured in .env.local (local dev)
// or in hosting project settings (production).
// IMPORTANT: Never hardcode fallback values for production secrets.
// This application requires Supabase credentials to function.

export function getEnv(key: string, fallback = ''): string {
  const value = process.env[key]
  if (!value) return fallback
  return value
}

export function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      'Please set it in your .env.local file or hosting environment variables.'
    )
  }
  return value
}

// Keep NEXT_PUBLIC values as literals so Next.js can inline them on the client.
// No fallback values - these must be configured in environment.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  ''

// Server-only key. Access via getEnv in server context to avoid client warnings.
export const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY')

// Validation helper - call this at startup
export function validateSupabaseConfig(): string[] {
  const errors: string[] = []
  if (!SUPABASE_URL) errors.push('SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL is not set')
  if (!SUPABASE_ANON_KEY) errors.push('SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
  return errors
}

export function isSupabaseConfigAvailable(): boolean {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY
}
