/**
 * Render Bridge — Main Website side (server-only).
 *
 * WordPress renders Elementor pages and keeps every published version; this module fetches the
 * live version of a page (and the list of such pages) with signed requests, caches them in the
 * Next.js data cache, and lets the signed publish webhook refresh exactly what changed.
 * A 5-minute time-based refresh is the safety net if a webhook is ever missed.
 */
import { unstable_cache } from 'next/cache'
import { getWordPressConfig } from './config.js'
import { wordpressGetJson } from './client.js'
import { signPayload } from './signature.js'
import { isValidBridgePath } from './bridgeRouting.js'
import { MANIFEST_TAG, PAGES_TAG, pageTag } from './tags.js'
import { sanitizeManifest } from './manifest.js'

const REVALIDATE_SECONDS = 300
const RENDER_TIMEOUT_MS = 10000

function signedHeaders(config, message) {
  const timestamp = Math.floor(Date.now() / 1000)
  return {
    'X-Acadvizen-Timestamp': String(timestamp),
    'X-Acadvizen-Signature': signPayload(message, timestamp, config.secret),
  }
}

function logFailure(message, error, extra = {}) {
  console.error(`[wordpress-bridge] ${message}`, {
    reason: error?.message || String(error),
    status: error?.status || null,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    ...extra,
  })
}

const fetchManifestCached = unstable_cache(
  async () => {
    const config = getWordPressConfig()
    const { status, data } = await wordpressGetJson(config, '/manifest', { headers: signedHeaders(config, 'manifest.') })
    // 404 = plugin not active on WordPress: deliberately no WordPress-rendered pages.
    return status === 404 ? { pages: [], redirects: [] } : sanitizeManifest(data)
  },
  ['wordpress-bridge-manifest-v1'],
  { tags: [MANIFEST_TAG, PAGES_TAG], revalidate: REVALIDATE_SECONDS }
)

/**
 * @returns {Promise<{pages: Array, redirects: Array} | null>} null when unavailable/disabled
 */
export async function fetchBridgeManifest() {
  const config = getWordPressConfig()
  if (!config.enabled || !config.secret) return null
  try {
    return await fetchManifestCached()
  } catch (error) {
    logFailure('Manifest unavailable; serving Main Website routes only.', error)
    return null
  }
}

function fetchDocumentCached(path) {
  return unstable_cache(
    async () => {
      const config = getWordPressConfig()
      const { status, data } = await wordpressGetJson(config, `/render?path=${encodeURIComponent(path)}`, {
        headers: signedHeaders(config, `render.${path}`),
        timeoutMs: RENDER_TIMEOUT_MS,
      })
      if (status === 404 || !data?.item || typeof data.item.html !== 'string') return null
      return {
        path: data.item.path,
        version: Number(data.item.version) || 0,
        noindex: data.item.noindex === true,
        updatedAt: data.item.updated_at || null,
        html: data.item.html,
      }
    },
    ['wordpress-bridge-document-v1', path],
    { tags: [PAGES_TAG, pageTag(path)], revalidate: REVALIDATE_SECONDS }
  )()
}

/**
 * The live WordPress-rendered document for a Main Website path.
 * @returns {Promise<{status: 'ok', document: object} | {status: 'missing'} | {status: 'error'}>}
 */
export async function fetchBridgeDocument(path) {
  const config = getWordPressConfig()
  if (!config.enabled || !config.secret || !isValidBridgePath(path)) return { status: 'missing' }
  try {
    const document = await fetchDocumentCached(path)
    return document && document.path === path ? { status: 'ok', document } : { status: 'missing' }
  } catch (error) {
    logFailure('Page unavailable.', error, { path })
    return { status: 'error' }
  }
}
