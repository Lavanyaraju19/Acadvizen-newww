/**
 * Existing Main Website blogs always win over WordPress blogs with the same address.
 *
 * A WordPress blog is never shown at /blog/<slug> when that address already belongs to the
 * Main Website: an existing Supabase blog (published OR unpublished), a known slug alias, or
 * a reserved sub-route. These rules are shared by the blog page, the blog list, the sitemap
 * and the WordPress admin slug check so they can never disagree.
 */
import { BLOG_SLUG_ALIASES } from '../blogSlugResolver.js'
import { sortPublicBlogs } from '../blogVisibility.js'

// Sub-routes under /blog/ that are not individual posts.
export const RESERVED_BLOG_SLUGS = new Set(['author', 'category', 'feed', 'page', 'rss', 'search', 'tag'])

/**
 * Conflicts that can be decided without a database lookup.
 * @returns {'reserved' | 'alias' | null}
 */
export function staticBlogSlugConflict(slug = '') {
  const value = String(slug || '').trim()
  if (RESERVED_BLOG_SLUGS.has(value)) return 'reserved'
  if (Object.prototype.hasOwnProperty.call(BLOG_SLUG_ALIASES, value)) return 'alias'
  return null
}

/**
 * Keeps only WordPress blogs whose address is free on the Main Website.
 * @param {Array} wordpressBlogs mapped WordPress blogs
 * @param {Set<string>} mainOwnedSlugs every non-deleted Supabase blog slug
 */
export function filterAvailableWordPressBlogs(wordpressBlogs = [], mainOwnedSlugs = new Set()) {
  return wordpressBlogs.filter((blog) => blog?.slug && !mainOwnedSlugs.has(blog.slug) && !staticBlogSlugConflict(blog.slug))
}

/**
 * Combined, newest-first list. Supabase rows are kept exactly as they are.
 */
export function mergeBlogLists(supabaseBlogs = [], wordpressBlogs = []) {
  const taken = new Set(supabaseBlogs.map((blog) => blog?.slug).filter(Boolean))
  const extra = wordpressBlogs.filter((blog) => blog?.slug && !taken.has(blog.slug) && !staticBlogSlugConflict(blog.slug))
  return sortPublicBlogs([...supabaseBlogs, ...extra])
}
