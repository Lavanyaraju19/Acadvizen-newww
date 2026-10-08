import { getWordPressConfig } from '../../lib/wordpress/config'
import { fetchBridgeDocument } from '../../lib/wordpress/bridge'
import { PATH_HEADER, isInternalRequest } from '../../lib/wordpress/internalToken'
import { isValidBridgePath, normalizeBridgePath } from '../../lib/wordpress/bridgeRouting'
import { prepareBridgedDocument } from '../../lib/wordpress/document'
import { GA_ID, GTM_ID, isAnalyticsEnabled, isMetaPixelEnabled } from '../../lib/analyticsConfig'
import { META_PIXEL_ID } from '../../lib/metaPixel'
import { siteConfig } from '../lib/seo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Internal rewrite target of src/middleware.js for pages designed in Elementor and published to
// the Main Website from WordPress (the Render Bridge). The visitor's URL stays the page's own
// address; requests that did not come through the middleware are refused.
const NO_STORE = 'private, no-cache, no-store, max-age=0, must-revalidate'

function textResponse(status, body, extra = {}) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': NO_STORE, ...extra } })
}

async function serve(request, { head = false } = {}) {
  const config = getWordPressConfig()
  if (!config.enabled || !(await isInternalRequest(request, config.secret))) {
    return textResponse(404, 'Not found', { 'X-Robots-Tag': 'noindex' })
  }

  const path = normalizeBridgePath(request.headers.get(PATH_HEADER) || '')
  if (!isValidBridgePath(path)) return textResponse(404, 'Not found')

  const result = await fetchBridgeDocument(path)
  if (result.status === 'missing') return textResponse(404, 'Page not found', { 'X-Robots-Tag': 'noindex' })
  if (result.status !== 'ok') {
    // Listed as published, but WordPress could not be reached and nothing is cached yet.
    return textResponse(503, 'This page is temporarily unavailable. Please try again in a minute.', { 'Retry-After': '60' })
  }
  const { document } = result

  const html = prepareBridgedDocument(document.html, {
    enabled: isAnalyticsEnabled(siteConfig.siteUrl),
    gtmId: GTM_ID,
    gaId: GA_ID,
    metaPixelId: META_PIXEL_ID,
    // As on every other public Main page (app/layout.jsx), independent of GA/GTM.
    metaPixelEnabled: isMetaPixelEnabled(),
  })
  return new Response(head ? null : html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': NO_STORE,
      'X-Acadvizen-Render-Version': String(document.version),
      ...(document.noindex ? { 'X-Robots-Tag': 'noindex' } : {}),
    },
  })
}

export function GET(request) {
  return serve(request)
}

export function HEAD(request) {
  return serve(request, { head: true })
}
