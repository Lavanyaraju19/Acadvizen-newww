import { getWordPressConfig } from '../../../../../../../lib/wordpress/config'
import { STATIC_CACHE_CONTROL, STATIC_MAX_BYTES, staticAssetPath } from '../../../../../../../lib/wordpress/staticAssets'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// /_acv/c/* and /_acv/i/* (next.config.mjs) -> WordPress static files for WordPress-rendered pages.
// Successful responses are cached by the Vercel CDN (s-maxage), so WordPress sees roughly one
// request per file per region instead of one per visitor (its host rate-limits bursts from the
// few addresses Vercel uses). GET/HEAD only, no cookies, static file types only.
const RETRY_STATUSES = new Set([429, 502, 503, 504])
const TIMEOUT_MS = 15000

function refuse(status) {
  return new Response(null, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } })
}

async function fetchWithRetry(url) {
  let response
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      response = await fetch(url, { headers: { Accept: '*/*' }, redirect: 'manual', cache: 'no-store', signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }
    if (!RETRY_STATUSES.has(response.status) || attempt === 3) return response
    const retryAfter = Number(response.headers.get('retry-after'))
    await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 2) * 1000 : 400 * attempt))
  }
  return response
}

async function handle(request, { params }) {
  const config = getWordPressConfig()
  if (!config.enabled || !config.origin) return refuse(404)
  const { area, path = [] } = await params
  let segments
  try {
    segments = path.map((segment) => decodeURIComponent(segment))
  } catch {
    return refuse(400)
  }
  const target = staticAssetPath(area, segments)
  if (!target) return refuse(404)

  const url = `${config.origin}${target}${new URL(request.url).search}`
  let upstream
  try {
    upstream = await fetchWithRetry(url)
  } catch (error) {
    console.error('[wordpress-static] Fetch failed.', { target, reason: error?.name === 'AbortError' ? 'timeout' : error?.message })
    return refuse(504)
  }
  if (upstream.status !== 200) return refuse(upstream.status === 404 ? 404 : 502)

  const size = Number(upstream.headers.get('content-length'))
  if (Number.isFinite(size) && size > STATIC_MAX_BYTES) return Response.redirect(url, 307)
  const body = await upstream.arrayBuffer()
  if (body.byteLength > STATIC_MAX_BYTES) return Response.redirect(url, 307)

  const headers = new Headers({ 'Cache-Control': STATIC_CACHE_CONTROL, 'X-Content-Type-Options': 'nosniff' })
  const contentType = upstream.headers.get('content-type')
  if (contentType) headers.set('Content-Type', contentType)
  return new Response(request.method === 'HEAD' ? null : body, { status: 200, headers })
}

export const GET = handle
export const HEAD = handle
