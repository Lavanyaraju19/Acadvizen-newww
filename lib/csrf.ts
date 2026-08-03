/**
 * CSRF protection for API routes.
 * Uses Origin & Referer header validation (best for SPA/API backends).
 * For cookie-based flows, also validates SameSite cookies.
 */

export interface CSRFConfig {
  /** Allowed origins (exact match or wildcard for development) */
  allowedOrigins: string[]
  /** Whether to require Referer header (stricter) */
  requireReferer?: boolean
  /** Whether to allow requests with no Origin header (same-origin GET requests) */
  allowMissingOrigin?: boolean
}

// The app's own configured URL must always be an allowed origin - a hardcoded list here
// previously only matched port 3000 and the two production domains, so any other host/port
// this app is actually served from (a different local dev port, a staging deployment, a
// disposable test environment) would have every real-browser admin save rejected with a 403,
// even though a same-origin browser request is exactly what CSRF protection is meant to allow.
function getDefaultAllowedOrigins(): string[] {
  const origins = new Set([
    'https://acadvizen.com',
    'https://www.acadvizen.com',
    'http://localhost:3000',
  ])
  for (const envVar of [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_SITE_URL]) {
    if (!envVar) continue
    try {
      origins.add(new URL(envVar).origin)
    } catch {
      // Ignore an invalid/unset URL rather than failing CSRF setup.
    }
  }
  return Array.from(origins)
}

function getDefaultConfig(): CSRFConfig {
  return {
    allowedOrigins: getDefaultAllowedOrigins(),
    requireReferer: false,
    allowMissingOrigin: true,
  }
}

/**
 * Validate the Origin header against allowed origins.
 */
function isValidOrigin(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return false
  const parsed = origin.toLowerCase().replace(/\/+$/, '')
  return allowedOrigins.some((allowed) => {
    const normalized = allowed.toLowerCase().replace(/\/+$/, '')
    if (normalized.startsWith('*')) {
      return parsed.endsWith(normalized.slice(1))
    }
    return parsed === normalized
  })
}

/**
 * Validate the Referer header against allowed origins.
 */
function isValidReferer(referer: string | null, allowedOrigins: string[]): boolean {
  if (!referer) return false
  try {
    const refererOrigin = new URL(referer).origin
    return isValidOrigin(refererOrigin, allowedOrigins)
  } catch {
    return false
  }
}

/**
 * Check if a request method is considered "safe" (no CSRF risk).
 * GET, HEAD, OPTIONS are safe per HTTP spec.
 */
function isSafeMethod(method: string): boolean {
  const upper = method.toUpperCase()
  return ['GET', 'HEAD', 'OPTIONS'].includes(upper)
}

/**
 * Validate a request for CSRF protection.
 * 
 * Returns:
 * - { passed: true } if the request is safe
 * - { passed: false, error: string } if the request is potentially a CSRF attack
 */
export function validateCSRF(
  request: Request,
  config: Partial<CSRFConfig> = {}
): { passed: boolean; error?: string } {
  const merged: CSRFConfig = { ...getDefaultConfig(), ...config }
  const method = request.method.toUpperCase()

  // Safe methods don't need CSRF protection
  if (isSafeMethod(method)) {
    return { passed: true }
  }

  // For same-origin requests (fetch/XHR in the same domain),
  // the Origin header is set by the browser.
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  
  // Check Origin header first (most reliable)
  if (origin) {
    if (!isValidOrigin(origin, merged.allowedOrigins)) {
      return {
        passed: false,
        error: `Cross-origin request blocked: origin '${origin}' is not allowed.`,
      }
    }
    return { passed: true }
  }

  // If no Origin, check Referer (fallback for some browsers/tools)
  if (referer) {
    if (!isValidReferer(referer, merged.allowedOrigins)) {
      return {
        passed: false,
        error: `Cross-origin request blocked: referer '${referer}' is not allowed.`,
      }
    }
    return { passed: true }
  }

  // No Origin and no Referer - decide based on config
  if (!merged.allowMissingOrigin) {
    return {
      passed: false,
      error: 'Request blocked: missing Origin and Referer headers.',
    }
  }

  return { passed: true }
}

/**
 * Express/Next.js middleware helper for API routes.
 * Pass the request object and get a response or null.
 * 
 * Usage in API routes:
 *   const csrfError = csrfProtection(request)
 *   if (csrfError) return csrfError
 */
export function csrfProtection(
  request: Request,
  config?: Partial<CSRFConfig>
): Response | null {
  const result = validateCSRF(request, config)
  if (!result.passed) {
    return new Response(
      JSON.stringify({ success: false, error: result.error }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Protection': '1',
        },
      }
    )
  }
  return null
}

/**
 * Generate CSRF token cookie configuration.
 */
export function getCSRFCookieOptions(): Record<string, string | boolean | number> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 86400, // 24 hours
  }
}

