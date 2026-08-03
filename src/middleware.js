import { NextResponse } from 'next/server'

function normalizeRedirectPath(value = '') {
  const nextValue = String(value || '').trim()
  if (!nextValue) return ''
  if (/^https?:\/\//i.test(nextValue)) return nextValue
  return nextValue.startsWith('/') ? nextValue : `/${nextValue}`
}

async function fetchPublicRedirect(pathname) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
  const normalizedPath = normalizeRedirectPath(pathname)

  if (!supabaseUrl || !supabaseAnonKey || !normalizedPath) {
    return null
  }

  const headers = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
  }

  const currentUrl = new URL('/rest/v1/redirects', supabaseUrl)
  currentUrl.searchParams.set('select', 'from_path,to_path,status_code,is_active')
  currentUrl.searchParams.set('from_path', `eq.${normalizedPath}`)
  currentUrl.searchParams.set('is_active', 'eq.true')
  currentUrl.searchParams.set('limit', '1')

  const currentResponse = await fetch(currentUrl, {
    headers,
    cache: 'no-store',
  })
  if (currentResponse.ok) {
    const rows = await currentResponse.json()
    if (Array.isArray(rows) && rows.length > 0) {
      return {
        fromPath: normalizeRedirectPath(rows[0].from_path),
        toPath: normalizeRedirectPath(rows[0].to_path),
        statusCode: Number(rows[0].status_code || 302) || 302,
      }
    }
  }

  const legacyUrl = new URL('/rest/v1/redirects', supabaseUrl)
  legacyUrl.searchParams.set('select', 'old_url,new_url,redirect_type,is_active')
  legacyUrl.searchParams.set('old_url', `eq.${normalizedPath}`)
  legacyUrl.searchParams.set('is_active', 'eq.true')
  legacyUrl.searchParams.set('limit', '1')

  const legacyResponse = await fetch(legacyUrl, {
    headers,
    cache: 'no-store',
  })
  if (!legacyResponse.ok) {
    return null
  }

  const legacyRows = await legacyResponse.json()
  if (!Array.isArray(legacyRows) || legacyRows.length === 0) {
    return null
  }

  return {
    fromPath: normalizeRedirectPath(legacyRows[0].old_url),
    toPath: normalizeRedirectPath(legacyRows[0].new_url),
    statusCode: Number(legacyRows[0].redirect_type || 302) || 302,
  }
}

function isSingleCmsSlugPath(pathname = '') {
  const segments = String(pathname || '').split('/').filter(Boolean)
  if (segments.length !== 1) return false
  const slug = segments[0]
  if (!slug || slug.includes('.')) return false
  const reserved = new Set([
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
  return !reserved.has(slug)
}

async function fetchCmsPagePrivacy(pathname) {
  if (!isSingleCmsSlugPath(pathname)) return null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
  const key = serviceKey || anonKey
  if (!supabaseUrl || !key) return null

  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const url = new URL('/rest/v1/pages', supabaseUrl)
  url.searchParams.set('select', 'id,slug,status')
  url.searchParams.set('slug', `eq.${slug}`)
  url.searchParams.set('limit', '1')

  const response = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
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
    const cmsPrivacy = await fetchCmsPagePrivacy(pathname)
    if (cmsPrivacy?.exists && !cmsPrivacy.published) {
      return cmsNotFoundResponse()
    }

    const redirectRule = await fetchPublicRedirect(pathname)
    if (!redirectRule?.toPath || redirectRule.toPath === pathname) {
      return NextResponse.next()
    }

    const forwardedProto = request.headers.get('x-forwarded-proto')
    const forwardedHost = request.headers.get('x-forwarded-host')
    const host = forwardedHost || request.headers.get('host') || request.nextUrl.host
    const protocol = forwardedProto || request.nextUrl.protocol.replace(':', '')
    const location = new URL(`${redirectRule.toPath}${search || ''}`, `${protocol}://${host}`)
    return new Response(null, {
      status: Number(redirectRule.statusCode || 302) === 301 ? 301 : 302,
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
