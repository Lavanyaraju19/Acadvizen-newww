/**
 * Environment variable management.
 * 
 * IMPORTANT: Never hardcode fallback values for production secrets.
 * All required variables must be configured in .env.local or hosting environment.
 * The application will fail at startup if required variables are missing.
 */

// ── Validation ──────────────────────────────────────────────────────────

/**
 * Get an environment variable with optional fallback.
 * For non-critical optional variables only.
 */
export function getEnv(key: string, fallback = ''): string {
  return process.env[key] || fallback
}

/**
 * Get a required environment variable.
 * Throws at (lazy) access time if missing.
 */
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

/**
 * Validate all required environment variables at startup.
 * Call this once at application initialization.
 * Returns an array of error messages (empty if all valid).
 */
export function validateAllEnv(): string[] {
  const errors: string[] = []

  // Required: Supabase
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }

  // Semi-required: Service role key (needed for admin operations)
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is recommended for admin operations')
  }

  // Required: App URL
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    errors.push('NEXT_PUBLIC_APP_URL is required for sitemap and OG tags')
  }

  return errors
}

export function validateSupabaseConfig(): string[] {
  return validateAllEnv().filter(
    (error) =>
      error.includes('SUPABASE_URL') ||
      error.includes('SUPABASE_ANON_KEY') ||
      error.includes('SUPABASE_SERVICE_ROLE_KEY')
  )
}

/**
 * Throw if any required environment variables are missing at startup.
 * Call this in layout.jsx or next.config.mjs initialization.
 */
export function assertValidEnv(): void {
  const errors = validateAllEnv()
  if (errors.length > 0) {
    const critical = errors.filter((e) => !e.includes('recommended'))
    if (critical.length > 0) {
      throw new Error(
        '❌ Environment configuration errors:\n' +
        critical.map((e) => `   - ${e}`).join('\n') +
        '\n\nPlease configure these in .env.local or your hosting environment.'
      )
    }
    // Only warnings for non-critical
    if (typeof console !== 'undefined') {
      console.warn(
        '⚠️  Environment configuration warnings:\n' +
        errors.map((e) => `   - ${e}`).join('\n')
      )
    }
  }
}

// ── Public (client-safe) values ─────────────────────────────────────────

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

// ── Server-only values ──────────────────────────────────────────────────

export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
export const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://acadvizen.com'

// ── Convenience checks ──────────────────────────────────────────────────

export function isSupabaseConfigAvailable(): boolean {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY
}
