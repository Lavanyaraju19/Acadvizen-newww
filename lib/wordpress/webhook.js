/**
 * Request handling for the two signed endpoints WordPress calls. Pure functions with injected
 * side effects, so they can be unit-tested without Next.js or Supabase.
 *
 * content_type "blog": structured blogs (acv_blog), identified by slug.
 * content_type "page": Render Bridge pages (Elementor-designed), identified by Main path.
 */
import { isValidPublicBlogSlug } from '../blogVisibility.js'
import { SIGNATURE_HEADER, TIMESTAMP_HEADER, verifySignature } from './signature.js'
import { isValidBridgePath } from './bridgeRouting.js'
import { BLOG_LIST_TAG, MANIFEST_TAG, blogTag, pageTag } from './tags.js'

export { BLOG_LIST_TAG, blogTag }

const MAX_BODY_BYTES = 16 * 1024
const NOT_CHECKED = { checked: false, conflict: false, reason: null }

/**
 * Remembers recently processed event ids so a retried/duplicated delivery is acknowledged
 * without repeating work. Best effort (per server instance); repeating a revalidation is harmless.
 */
export function createEventDeduper({ ttlMs = 10 * 60 * 1000, maxEntries = 500 } = {}) {
  const seen = new Map()
  return {
    has(id, now = Date.now()) {
      const at = seen.get(id)
      return at !== undefined && now - at < ttlMs
    },
    add(id, now = Date.now()) {
      seen.set(id, now)
      if (seen.size > maxEntries) seen.delete(seen.keys().next().value)
    },
  }
}

function reply(status, body) {
  return { status, body }
}

function readHeader(headers, name) {
  if (!headers) return ''
  if (typeof headers.get === 'function') return headers.get(name) || ''
  return headers[name] || ''
}

function authenticate({ rawBody, headers, config, now }) {
  if (!config.enabled) return reply(503, { ok: false, error: 'wordpress_content_disabled' })
  if (!config.secret) return reply(503, { ok: false, error: 'not_configured' })
  if (Buffer.byteLength(rawBody || '', 'utf8') > MAX_BODY_BYTES) return reply(413, { ok: false, error: 'payload_too_large' })

  const verdict = verifySignature({
    body: rawBody,
    timestamp: readHeader(headers, TIMESTAMP_HEADER),
    signature: readHeader(headers, SIGNATURE_HEADER),
    secret: config.secret,
    now,
  })
  if (!verdict.ok) return reply(401, { ok: false, error: verdict.reason })

  try {
    const payload = JSON.parse(rawBody)
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('not an object')
    return { payload }
  } catch {
    return reply(400, { ok: false, error: 'invalid_json' })
  }
}

async function safeStatus(check, value) {
  if (typeof check !== 'function') return NOT_CHECKED
  try {
    return (await check(value)) || NOT_CHECKED
  } catch {
    return NOT_CHECKED
  }
}

/**
 * Validates a change and returns what to revalidate, or an error reply.
 */
function planChange(payload) {
  const { content_type: contentType, action } = payload
  if (contentType !== 'blog' && contentType !== 'page') return { error: reply(400, { ok: false, error: 'unsupported_content_type' }) }
  if (action !== 'upsert' && action !== 'remove') return { error: reply(400, { ok: false, error: 'invalid_action' }) }

  if (contentType === 'blog') {
    const { slug, previous_slug: previousSlug } = payload
    if (!isValidPublicBlogSlug(slug)) return { error: reply(400, { ok: false, error: 'invalid_slug' }) }
    if (previousSlug != null && !isValidPublicBlogSlug(previousSlug)) return { error: reply(400, { ok: false, error: 'invalid_previous_slug' }) }
    const slugs = [slug, previousSlug].filter(Boolean)
    return {
      contentType,
      key: slug,
      tags: [BLOG_LIST_TAG, ...slugs.map(blogTag)],
      paths: ['/blog', ...slugs.map((value) => `/blog/${value}`), '/sitemap.xml'],
    }
  }

  const { path, previous_path: previousPath } = payload
  if (typeof path !== 'string' || !isValidBridgePath(path)) return { error: reply(400, { ok: false, error: 'invalid_path' }) }
  if (previousPath != null && (typeof previousPath !== 'string' || !isValidBridgePath(previousPath))) {
    return { error: reply(400, { ok: false, error: 'invalid_previous_path' }) }
  }
  const paths = [path, previousPath].filter(Boolean)
  return {
    contentType,
    key: path,
    tags: [MANIFEST_TAG, ...paths.map(pageTag)],
    paths: [...paths, '/sitemap.xml'],
  }
}

/**
 * POST /api/wordpress/revalidate
 * Body: { event_id, content_type: 'blog'|'page', action: 'upsert'|'remove',
 *         slug + previous_slug? (blog) | path + previous_path? (page) }
 */
export async function handleRevalidateRequest({
  rawBody,
  headers,
  config,
  now = Date.now(),
  deduper,
  revalidateTag,
  revalidatePath,
  checkSlug,
  checkPagePath,
  log = () => {},
}) {
  const auth = authenticate({ rawBody, headers, config, now })
  if (!auth.payload) {
    log('rejected', { status: auth.status, error: auth.body.error })
    return auth
  }

  const eventId = auth.payload.event_id
  if (typeof eventId !== 'string' || !/^[\w-]{8,100}$/.test(eventId)) return reply(400, { ok: false, error: 'invalid_event_id' })

  const plan = planChange(auth.payload)
  if (plan.error) return plan.error

  const upsert = auth.payload.action === 'upsert'
  const slugStatus = upsert ? await safeStatus(plan.contentType === 'blog' ? checkSlug : checkPagePath, plan.key) : NOT_CHECKED

  if (deduper?.has(eventId, now)) {
    log('duplicate', { eventId, contentType: plan.contentType, key: plan.key })
    return reply(200, { ok: true, duplicate: true, slug_status: slugStatus })
  }

  plan.tags.forEach((tag) => revalidateTag(tag))
  plan.paths.forEach((path) => revalidatePath(path))
  deduper?.add(eventId, now)

  log('revalidated', { eventId, contentType: plan.contentType, action: auth.payload.action, key: plan.key, conflict: slugStatus.conflict })
  return reply(200, { ok: true, duplicate: false, revalidated: { tags: plan.tags, paths: plan.paths }, slug_status: slugStatus })
}

/**
 * POST /api/wordpress/slug-check
 * Body: { content_type: 'blog', slug } | { content_type: 'page', path }
 */
export async function handleSlugCheckRequest({ rawBody, headers, config, now = Date.now(), checkSlug, checkPagePath }) {
  const auth = authenticate({ rawBody, headers, config, now })
  if (!auth.payload) return auth

  const { content_type: contentType, slug, path } = auth.payload
  if (contentType === 'blog') {
    if (!isValidPublicBlogSlug(slug)) return reply(400, { ok: false, error: 'invalid_slug' })
    return reply(200, { ok: true, slug_status: await safeStatus(checkSlug, slug) })
  }
  if (contentType === 'page') {
    if (typeof path !== 'string' || !isValidBridgePath(path)) return reply(400, { ok: false, error: 'invalid_path' })
    return reply(200, { ok: true, slug_status: await safeStatus(checkPagePath, path) })
  }
  return reply(400, { ok: false, error: 'unsupported_content_type' })
}
