import { NextResponse } from 'next/server'
import { getWordPressConfig } from '../lib/wordpress/config.js'
import { decideBridgeRoute, normalizeBridgePath, wantsMainFallback } from '../lib/wordpress/bridgeRouting.js'
import { createManifestLookup } from '../lib/wordpress/manifestLookup.js'
import { INTERNAL_HEADER, PATH_HEADER, deriveInternalToken } from '../lib/wordpress/internalToken.js'
import { OWNED_CONTENT_MESSAGE, isWordPressOwnedWrite, isWordPressOwnershipEnabled } from '../lib/wordpress/contentOwnership.js'
import { fetchCmsPagePrivacy as fetchPageStatusAtAddress, shouldHidePage } from '../lib/cmsPagePrivacy.js'
import { selectSupabaseServiceKey } from '../lib/supabaseServiceKey.js'

// Acadvizen Render Bridge: pages designed in Elementor and published to the Main Website from
// WordPress are served by app/wp-render (an internal rewrite, so the address stays the same).
// The list of such pages is looked up with a time limit and memoised per middleware instance
// (lib/wordpress/manifestLookup.js), so a slow WordPress never holds a page up: the request goes on
// with the last known list, or with Main's own page. Page contents are refreshed immediately by the
// signed publish webhook.
let bridgeManifestOrigin = ''
let bridgeManifestLookup = null

function getBridgeManifest(request) {
  const config = getWordPressConfig()
  if (!config.enabled || !config.secret) return null
  bridgeManifestOrigin = request.nextUrl.origin
  if (!bridgeManifestLookup) {
    bridgeManifestLookup = createManifestLookup({
      load: async (signal) => {
        const token = await deriveInternalToken(config.secret)
        // A protected Vercel preview (the staging Main Website) also challenges its own
        // server-side requests; Vercel provides this secret when automation bypass is enabled.
        const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
        const response = await fetch(new URL('/api/wordpress/bridge-manifest', bridgeManifestOrigin), {
          headers: { [INTERNAL_HEADER]: token, ...(bypass ? { 'x-vercel-protection-bypass': bypass } : {}) },
          cache: 'no-store',
          signal,
        })
        const json = response.ok ? await response.json() : null
        return json?.manifest || null
      },
    })
  }
  return bridgeManifestLookup()
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
  // The new secret key first when it is valid, as lib/env.ts does, so the legacy key can be retired later.
  const serviceKey = selectSupabaseServiceKey({
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  })
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

async function fetchCmsPagePrivacy(pathname) {
  const { supabaseUrl, serviceKey, anonKey } = getSupabaseRestConfig()
  return fetchPageStatusAtAddress(pathname, { supabaseUrl, key: serviceKey || anonKey })
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
      // A page WordPress no longer has (just unpublished): Main's own page (see app/wp-render).
      manifest: wantsMainFallback(request.nextUrl.searchParams) ? null : bridgeManifest,
      mainPageExists: Boolean(cmsPrivacy?.exists),
    })
    // An administrator explicitly chose to replace the existing Main page at this address.
    if (bridgeDecision.action === 'bridge' && bridgeDecision.entry.replace) {
      return bridgeResponse(request, pathname, bridgeDecision)
    }

    if (shouldHidePage(cmsPrivacy)) {
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
