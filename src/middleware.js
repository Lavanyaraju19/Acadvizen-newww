import { NextResponse } from 'next/server'
import { getWordPressConfig } from '../lib/wordpress/config.js'
import { decideBridgeRoute, normalizeBridgePath } from '../lib/wordpress/bridgeRouting.js'
import { INTERNAL_HEADER, PATH_HEADER, deriveInternalToken } from '../lib/wordpress/internalToken.js'
import { OWNED_CONTENT_MESSAGE, isWordPressOwnedWrite, isWordPressOwnershipEnabled } from '../lib/wordpress/contentOwnership.js'

// Acadvizen Render Bridge: pages designed in Elementor and published to the Main Website from
// WordPress are served by app/wp-render (an internal rewrite, so the address stays the same).
// The list of such pages is memoised per middleware instance for 30 seconds; page contents are
// refreshed immediately by the signed publish webhook.
const BRIDGE_MANIFEST_TTL_MS = 30_000
let bridgeManifestMemo = { at: 0, value: null, pending: null }

async function getBridgeManifest(request) {
  const config = getWordPressConfig()
  if (!config.enabled || !config.secret) return null
  if (bridgeManifestMemo.at && Date.now() - bridgeManifestMemo.at < BRIDGE_MANIFEST_TTL_MS) {
    return bridgeManifestMemo.value
  }
  if (!bridgeManifestMemo.pending) {
    const load = async () => {
      try {
        const token = await deriveInternalToken(config.secret)
        // A protected Vercel preview (the staging Main Website) also challenges its own
        // server-side requests; Vercel provides this secret when automation bypass is enabled.
        const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
        const response = await fetch(new URL('/api/wordpress/bridge-manifest', request.url), {
          headers: { [INTERNAL_HEADER]: token, ...(bypass ? { 'x-vercel-protection-bypass': bypass } : {}) },
          cache: 'no-store',
        })
        const json = response.ok ? await response.json() : null
        return json?.manifest || null
      } catch {
        return null
      }
    }
    // A new instance's first lookup can fail while the manifest route itself is starting up; one
    // retry avoids serving that visitor the pre-WordPress page. A failed lookup is not memoised,
    // so the next request tries again instead of skipping WordPress for the whole TTL.
    bridgeManifestMemo.pending = load()
      .then((value) => value || load())
      .then((value) => {
        bridgeManifestMemo = value
          ? { at: Date.now(), value, pending: null }
          : { at: 0, value: bridgeManifestMemo.value, pending: null }
        return value || bridgeManifestMemo.value
      })
  }
  return bridgeManifestMemo.pending
}

async function bridgeResponse(request, pathname, decision) {
  if (decision.action === 'redirect') {
    return NextResponse.redirect(new URL(decision.to, request.url), 301)
  }
  if (decision.action !== 'bridge') return null
  const config = getWordPressConfig()
  const url = new URL('/wp-render', request.url)
  url.search = ''
  const headers = new Headers(request.headers)
  headers.set(INTERNAL_HEADER, await deriveInternalToken(config.secret))
  headers.set(PATH_HEADER, normalizeBridgePath(pathname))
  return NextResponse.rewrite(url, { request: { headers } })
}

// These two checks must reflect admin changes (a newly created redirect, a just-published/
// unpublished page) immediately - the CMS test suite enforces zero-tolerance immediate
// consistency (create a redirect, fetch it with no delay, expect the live status code), so
// this file deliberately does NOT cache Supabase results across requests. What it does fix
// versus the original implementation: the two checks are independent, so they now run
// concurrently via Promise.all instead of one after another, and the redirects table's two
// historical column conventions (from_path/to_path/status_code and the older
// old_url/new_url/redirect_type) are queried in a single request instead of two sequential
// ones - cutting per-navigation Supabase round trips from up to three sequential calls down
// to at most two concurrent ones, while keeping every check live.

function normalizeRedirectPath(value = '') {
  const nextValue = String(value || '').trim()
  if (!nextValue) return ''
  if (/^https?:\/\//i.test(nextValue)) return nextValue
  return nextValue.startsWith('/') ? nextValue : `/${nextValue}`
}

function getSupabaseRestConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return { supabaseUrl, anonKey, serviceKey }
}

async function fetchPublicRedirect(pathname) {
  const { supabaseUrl, anonKey } = getSupabaseRestConfig()
  const normalizedPath = normalizeRedirectPath(pathname)
  if (!supabaseUrl || !anonKey || !normalizedPath) return null

  const url = new URL('/rest/v1/redirects', supabaseUrl)
  url.searchParams.set('select', 'from_path,to_path,status_code,old_url,new_url,redirect_type,is_active')
  url.searchParams.set(
    'or',
    `(from_path.eq.${normalizedPath},old_url.eq.${normalizedPath})`
  )
  url.searchParams.set('is_active', 'eq.true')
  url.searchParams.set('limit', '1')

  const response = await fetch(url, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    cache: 'no-store',
  })
  if (!response.ok) return null

  const rows = await response.json().catch(() => [])
  const row = Array.isArray(rows) ? rows[0] : null
  if (!row) return null

  const fromPath = normalizeRedirectPath(row.from_path || row.old_url)
  const toPath = normalizeRedirectPath(row.to_path || row.new_url)
  if (!fromPath || !toPath) return null

  const statusCode = Number(row.status_code || row.redirect_type || 302) || 302
  return { fromPath, toPath, statusCode: statusCode === 301 ? 301 : 302 }
}

const RESERVED_SINGLE_SEGMENT_SLUGS = new Set([
  'about',
  'achievements',
  'admin',
  'admin-login',
  'api',
  'blog',
  'contact',
  'courses',
  'dashboard',
  'forgot-password',
  'hire-from-us',
  'login',
  'maintenance',
  'placement',
  'privacy-policy',
  'projects',
  'register',
  'sales',
  'soft-skills',
  'terms-of-service',
  'testimonials',
  'tools',
])

function isSingleCmsSlugPath(pathname = '') {
  const segments = String(pathname || '').split('/').filter(Boolean)
  if (segments.length !== 1) return false
  const slug = segments[0]
  if (!slug || slug.includes('.')) return false
  return !RESERVED_SINGLE_SEGMENT_SLUGS.has(slug)
}

async function fetchCmsPagePrivacy(pathname) {
  if (!isSingleCmsSlugPath(pathname)) return null

  const { supabaseUrl, serviceKey, anonKey } = getSupabaseRestConfig()
  const key = serviceKey || anonKey
  if (!supabaseUrl || !key) return null

  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const url = new URL('/rest/v1/pages', supabaseUrl)
  url.searchParams.set('select', 'id,slug,status')
  url.searchParams.set('slug', `eq.${slug}`)
  url.searchParams.set('limit', '1')

  const response = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: 'no-store',
  })
  if (!response.ok) return null

  const rows = await response.json().catch(() => [])
  const page = Array.isArray(rows) ? rows[0] : null
  if (!page?.id) return null
  return {
    exists: true,
    published: String(page.status || '').toLowerCase() === 'published',
  }
}

function cmsNotFoundResponse() {
  return new Response('Page not found', {
    status: 404,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'x-robots-tag': 'noindex',
    },
  })
}

export default async function middleware(request) {
  const { pathname, search } = request.nextUrl
  const method = request.method.toUpperCase()

  // Public content managed in WordPress: the Main Website's own /admin may not change it.
  if (pathname.startsWith('/api/cms/')) {
    if (isWordPressOwnedWrite({ method, pathname, enabled: isWordPressOwnershipEnabled() })) {
      return NextResponse.json({ error: OWNED_CONTENT_MESSAGE, managed_in: 'wordpress' }, { status: 423 })
    }
    return NextResponse.next()
  }

  if (!['GET', 'HEAD'].includes(method)) {
    return NextResponse.next()
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    /^\/wp-(content|includes|json|admin)(\/|$)/.test(pathname) ||
    pathname.startsWith('/_acv/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next()
  }

  try {
    // Independent lookups - resolve them concurrently instead of one after another.
    const [cmsPrivacy, redirectRule, bridgeManifest] = await Promise.all([
      fetchCmsPagePrivacy(pathname),
      fetchPublicRedirect(pathname),
      getBridgeManifest(request),
    ])

    const bridgeDecision = decideBridgeRoute({
      pathname,
      manifest: bridgeManifest,
      mainPageExists: Boolean(cmsPrivacy?.exists),
    })
    // An administrator explicitly chose to replace the existing Main page at this address.
    if (bridgeDecision.action === 'bridge' && bridgeDecision.entry.replace) {
      return bridgeResponse(request, pathname, bridgeDecision)
    }

    if (cmsPrivacy?.exists && !cmsPrivacy.published) {
      return cmsNotFoundResponse()
    }

    if (!redirectRule?.toPath || redirectRule.toPath === pathname) {
      return (await bridgeResponse(request, pathname, bridgeDecision)) || NextResponse.next()
    }

    const forwardedProto = request.headers.get('x-forwarded-proto')
    const forwardedHost = request.headers.get('x-forwarded-host')
    const host = forwardedHost || request.headers.get('host') || request.nextUrl.host
    const protocol = forwardedProto || request.nextUrl.protocol.replace(':', '')
    const location = new URL(`${redirectRule.toPath}${search || ''}`, `${protocol}://${host}`)
    return new Response(null, {
      status: redirectRule.statusCode,
      headers: {
        Location: location.toString(),
      },
    })
  } catch {
    return NextResponse.next()
  }
}

// /api and /admin are excluded here too, not just inside the function body above: Next's
// middleware layer buffers the request body while routing it through middleware (even when
// the middleware itself reads nothing), which imposes its own ~10MB cap independent of any
// limit the route handler enforces. That silently truncated large multipart uploads (e.g.
// admin media/video uploads) into a broken body, producing a confusing 500 instead of the
// upload route's own clean "file too large" response. Excluding these prefixes at the
// matcher level (matching what the function already does with its own early-return checks)
// means POST bodies to /api and /admin routes never pass through middleware's buffering at all.
export const config = {
  // _acv: WordPress files and form endpoints proxied by next.config.mjs rewrites for Render Bridge
  // pages (wp-* paths are denied by Vercel's platform protection); they never need these lookups.
  matcher: [
    '/((?!api|admin|_next/static|_next/image|favicon.ico|_acv/|wp-content|wp-includes|wp-json|wp-admin).*)',
    // Content-authoring CMS APIs only (single source of truth); never uploads, media or leads.
    '/api/cms/((?!upload|media|import-export|leads|users|audit-log|health|revalidate|forms).*)',
  ],
}
