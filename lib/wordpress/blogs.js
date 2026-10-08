/**
 * WordPress blogs for the Main Website (server-side only).
 *
 * WordPress responses are cached in the Next.js data cache, tagged so the signed webhook can
 * refresh them immediately, with a 5-minute time-based refresh as a safety net if a webhook is
 * missed. Failures never break a page: they log and fall back to "no WordPress blogs".
 */
import { unstable_cache } from 'next/cache'
import { getWordPressConfig } from './config.js'
import { wordpressGetJson } from './client.js'
import { mapWordPressBlog } from './blogMapper.js'
import { filterAvailableWordPressBlogs, staticBlogSlugConflict } from './blogPrecedence.js'
import { BLOG_LIST_TAG, blogTag } from './webhook.js'
import { fetchMainOwnedBlogSlugs } from './mainBlogSlugs.js'

const REVALIDATE_SECONDS = 300
const PER_PAGE = 100
const MAX_PAGES = 5

function logFailure(message, error, extra = {}) {
  console.error(`[wordpress] ${message}`, {
    reason: error?.message || String(error),
    status: error?.status || null,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    ...extra,
  })
}

const fetchBlogListFromWordPress = unstable_cache(
  async () => {
    const config = getWordPressConfig()
    const items = []
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const { status, data, headers } = await wordpressGetJson(config, `/blogs?per_page=${PER_PAGE}&page=${page}`)
      // 404 on the list route means the plugin is not active: deliberately no WordPress blogs.
      if (status === 404) return []
      items.push(...(Array.isArray(data?.items) ? data.items : []))
      if (page >= Number(headers.get('x-wp-totalpages') || 1)) break
    }
    return items
  },
  ['wordpress-blog-list-v1'],
  { tags: [BLOG_LIST_TAG], revalidate: REVALIDATE_SECONDS }
)

function fetchBlogFromWordPress(slug) {
  return unstable_cache(
    async () => {
      const { status, data } = await wordpressGetJson(getWordPressConfig(), `/blogs/${encodeURIComponent(slug)}`)
      return status === 404 ? null : data?.item || null
    },
    ['wordpress-blog-v1', slug],
    { tags: [BLOG_LIST_TAG, blogTag(slug)], revalidate: REVALIDATE_SECONDS }
  )()
}

/**
 * Published WordPress blogs targeted at the Main Website, excluding any address the Main
 * Website already owns. Newest first. Returns [] when disabled or on any failure.
 */
export async function fetchWordPressBlogsForMain() {
  const config = getWordPressConfig()
  if (!config.enabled) return []
  try {
    const mapped = (await fetchBlogListFromWordPress())
      .map((item) => mapWordPressBlog(item, { imageHostname: config.hostname }))
      .filter(Boolean)
    const owned = await fetchMainOwnedBlogSlugs(mapped.map((blog) => blog.slug))
    return filterAvailableWordPressBlogs(mapped, owned)
  } catch (error) {
    logFailure('Blog list unavailable; showing Main blogs only.', error)
    return []
  }
}

/**
 * A single WordPress blog for /blog/<slug>, or null. Only call this after the existing Main
 * (Supabase) lookup found nothing; it re-checks ownership so a Main draft is never shadowed.
 */
export async function fetchWordPressBlogBySlugForMain(slug) {
  const config = getWordPressConfig()
  if (!config.enabled || staticBlogSlugConflict(slug)) return null
  try {
    const item = await fetchBlogFromWordPress(slug)
    const blog = item ? mapWordPressBlog(item, { imageHostname: config.hostname }) : null
    if (!blog || blog.slug !== slug) return null
    const owned = await fetchMainOwnedBlogSlugs([slug])
    return owned.has(slug) ? null : blog
  } catch (error) {
    logFailure('Blog unavailable.', error, { slug })
    return null
  }
}
