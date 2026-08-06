/**
 * Production-grade IP-based rate limiter.
 * Uses an in-memory sliding window with optional external store support.
 * For multi-instance deployments, replace the Map with Redis.
 */

export interface RateLimiterConfig {
  windowMs: number
  maxRequests: number
  /** Trusted proxy IPs that can set X-Forwarded-For */
  trustedProxies?: string[]
  /** Custom key prefix for external stores */
  keyPrefix?: string
}

interface WindowEntry {
  timestamps: number[]
  blockedUntil: number
}

const DEFAULT_CONFIG: RateLimiterConfig = {
  windowMs: 60_000, // 1 minute
  maxRequests: 100, // 100 requests per minute
}

const STORES = new Map<string, Map<string, WindowEntry>>()

function getStore(name: string): Map<string, WindowEntry> {
  if (!STORES.has(name)) {
    STORES.set(name, new Map())
  }
  return STORES.get(name)!
}

function cleanupStore(store: Map<string, WindowEntry>, windowMs: number) {
  const now = Date.now()
  store.forEach((entry, key) => {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs)
    if (entry.timestamps.length === 0 && entry.blockedUntil < now) {
      store.delete(key)
    }
  })
}

export class RateLimiter {
  private config: RateLimiterConfig
  private storeName: string

  constructor(config: Partial<RateLimiterConfig> = {}, storeName = 'default') {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.storeName = storeName
  }

  /**
   * Extract client IP from request headers.
   * Respects trusted proxies.
   */
  getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const trusted = this.config.trustedProxies || []

    if (forwarded) {
      const ips = forwarded.split(',').map((ip) => ip.trim())
      // If the last proxy is trusted, use the first untrusted IP
      for (let i = ips.length - 1; i >= 0; i--) {
        if (!trusted.includes(ips[i])) {
          return ips[i]
        }
      }
      return ips[0] || 'unknown'
    }

    if (realIP) return realIP

    // Cloudflare support
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    if (cfConnectingIP) return cfConnectingIP

    return '127.0.0.1'
  }

  /**
   * Check if a request is allowed based on the rate limit.
   * Returns { allowed: boolean, remaining: number, retryAfter: number }
   */
  check(key: string, now = Date.now()): {
    allowed: boolean
    remaining: number
    retryAfter: number
  } {
    const store = getStore(this.storeName)
    const entry = store.get(key) || { timestamps: [], blockedUntil: 0 }

    // Cleanup old entries periodically (every ~100 requests)
    if (Math.random() < 0.01) {
      cleanupStore(store, this.config.windowMs)
    }

    // Check if currently blocked
    if (entry.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
      }
    }

    // Remove expired timestamps
    entry.timestamps = entry.timestamps.filter((t) => now - t < this.config.windowMs)

    if (entry.timestamps.length >= this.config.maxRequests) {
      // Block for the remaining window + 1 extra second
      entry.blockedUntil = now + this.config.windowMs + 1000
      store.set(key, entry)
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
      }
    }

    entry.timestamps.push(now)
    store.set(key, entry)

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.timestamps.length,
      retryAfter: 0,
    }
  }

  /**
   * Middleware-compatible check. Returns headers to set on response.
   */
  middleware(request: Request): {
    passed: boolean
    status: number
    headers: Record<string, string>
    body: Record<string, unknown>
  } {
    const ip = this.getClientIP(request)
    const key = `${this.config.keyPrefix || 'rl'}:${ip}`
    const result = this.check(key)

    const rateLimitHeaders: Record<string, string> = {
      'X-RateLimit-Limit': String(this.config.maxRequests),
      'X-RateLimit-Remaining': String(result.remaining),
    }

    if (!result.allowed) {
      rateLimitHeaders['Retry-After'] = String(result.retryAfter)
      return {
        passed: false,
        status: 429,
        headers: rateLimitHeaders,
        body: {
          success: false,
          error: `Too many requests. Please try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter,
        },
      }
    }

    return {
      passed: true,
      status: 200,
      headers: rateLimitHeaders,
      body: {},
    }
  }

  /**
   * Reset rate limit for a given key (for testing/admin).
   */
  reset(key: string) {
    const store = getStore(this.storeName)
    store.delete(key)
  }

  /**
   * Get current config.
   */
  getConfig(): RateLimiterConfig {
    return { ...this.config }
  }
}

// ── Pre-configured instances ──────────────────────────────────────────

// 30 requests/minute/IP: still blocks a real password-guessing burst (which needs hundreds of
// attempts to be worth anything), but doesn't stand between a legitimate office IP with several
// admins signing in around the same time, or a session that repeatedly re-authenticates (e.g.
// an automated test suite - this project's own E2E login flow re-authenticates once per test
// case, and 10/min meant a full suite run would start tripping this well before finishing).
// GoTrue/Supabase Auth's own backend rate limiting is the second, stricter layer behind this one.
export const authLimiter = new RateLimiter(
  { windowMs: 60_000, maxRequests: 30, keyPrefix: 'auth' },
  'auth'
)

/** Moderate limiter for API write endpoints: 30 requests per minute */
export const apiWriteLimiter = new RateLimiter(
  { windowMs: 60_000, maxRequests: 30, keyPrefix: 'api-write' },
  'api-write'
)

/** Standard limiter for public read APIs: 100 requests per minute */
export const apiReadLimiter = new RateLimiter(
  { windowMs: 60_000, maxRequests: 100, keyPrefix: 'api-read' },
  'api-read'
)

/** Strict limiter for form/lead submissions: 5 requests per minute */
export const formSubmitLimiter = new RateLimiter(
  { windowMs: 60_000, maxRequests: 5, keyPrefix: 'form' },
  'form'
)

/** Upload limiter: 10 requests per minute */
export const uploadLimiter = new RateLimiter(
  { windowMs: 60_000, maxRequests: 10, keyPrefix: 'upload' },
  'upload'
)

