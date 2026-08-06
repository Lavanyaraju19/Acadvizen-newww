import { NextResponse } from 'next/server'

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

  if (!['GET', 'HEAD'].includes(method)) {
    return NextResponse.next()
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next()
  }

  try {
    // Independent lookups - resolve them concurrently instead of one after another.
    const [cmsPrivacy, redirectRule] = await Promise.all([
      fetchCmsPagePrivacy(pathname),
      fetchPublicRedirect(pathname),
    ])

    if (cmsPrivacy?.exists && !cmsPrivacy.published) {
      return cmsNotFoundResponse()
    }

    if (!redirectRule?.toPath || redirectRule.toPath === pathname) {
      return NextResponse.next()
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

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
