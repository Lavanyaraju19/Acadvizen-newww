import { isValidBridgePath } from './bridgeRouting.js'

/**
 * Validates the Render Bridge manifest received from WordPress (pure).
 */
export function sanitizeManifest(data) {
  const pages = (Array.isArray(data?.pages) ? data.pages : [])
    .filter((page) => page && isValidBridgePath(page.path))
    .map((page) => ({
      path: page.path,
      postId: Number(page.post_id) || null,
      version: Number(page.version) || 0,
      replace: page.replace === true,
      noindex: page.noindex === true,
      updatedAt: typeof page.updated_at === 'string' ? page.updated_at : null,
    }))
  const redirects = (Array.isArray(data?.redirects) ? data.redirects : [])
    .filter((r) => r && isValidBridgePath(r.from) && isValidBridgePath(r.to) && r.from !== r.to)
    .map((r) => ({ from: r.from, to: r.to }))
  return { pages, redirects }
}
