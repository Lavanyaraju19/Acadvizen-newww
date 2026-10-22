import { getServerSupabaseClient } from './supabaseServer'
import { getCanonicalPath } from './cmsPublishing.js'
import { fetchPublishedPublicBlogs } from './publicBlogData.js'
import { fetchWordPressBlogsForMain } from './wordpress/blogs.js'
import { mergeBlogLists } from './wordpress/blogPrecedence.js'
import { fetchBridgeManifest } from './wordpress/bridge.js'
import { STATIC_ROUTES, indexableRows, withoutRedirected } from './publicSitemapRoutes.js'
import { mainOwnedReason } from './wordpress/bridgeRouting.js'

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://acadvizen.com').replace(/\/+$/, '')


async function fetchSitemapSettings(supabase) {
  try {
    const { data } = await supabase
      .from('sitemap_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return data || {}
  } catch {
    return {}
  }
}

// Some tables (pages/blogs/courses/city_pages) have an admin-controlled
// `exclude_from_sitemap` flag; others never got the column. Retry without the
// filter instead of dropping the whole content type when it's missing.
// `respectNoindex` is for tables whose public page honours its own `noindex` flag (pages).
async function fetchSlugRows(supabase, table, { eqFilters = [], respectExcludeFlag = true, respectNoindex = false } = {}) {
  const options = { excludeFlag: respectExcludeFlag, noindex: respectNoindex }
  const runQuery = async () => {
    let query = supabase.from(table).select(options.noindex ? 'slug, updated_at, noindex' : 'slug, updated_at')
    for (const filter of eqFilters) query = query.eq(filter.column, filter.value)
    if (options.excludeFlag) query = query.neq('exclude_from_sitemap', true)
    return query
  }

  try {
    let { data, error } = await runQuery()
    // A missing optional column only drops that one filter.
    while (error) {
      const message = error.message || ''
      if (options.excludeFlag && /exclude_from_sitemap/i.test(message)) options.excludeFlag = false
      else if (options.noindex && /noindex/i.test(message)) options.noindex = false
      else return []
      ;({ data, error } = await runQuery())
    }
    return Array.isArray(data) ? indexableRows(data) : []
  } catch {
    return []
  }
}

const LIST_PAGE_TABLES = { '/companies': 'companies', '/internships': 'internships', '/resources': 'resources' }

async function hasActiveRows(supabase, table) {
  try {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true }).eq('is_active', true)
    return !error && count > 0
  } catch {
    return false
  }
}

async function fetchAuthorRows(supabase) {
  try {
    const { data, error } = await supabase.from('authors').select('id, slug')
    return error || !Array.isArray(data) ? [] : data
  } catch {
    return []
  }
}

// Author ids that have at least one published blog post.
async function fetchAuthorIdsWithPublishedPosts(supabase) {
  try {
    const { data, error } = await supabase.from('blogs').select('author_id').eq('status', 'published').not('author_id', 'is', null)
    if (error || !Array.isArray(data)) return new Set()
    return new Set(data.map((row) => row.author_id))
  } catch {
    return new Set()
  }
}

// Page slugs whose seo_metadata override says noindex (app/(public)/[slug]/page.jsx honours it).
async function fetchNoindexSeoSlugs(supabase) {
  try {
    const { data, error } = await supabase.from('seo_metadata').select('page_slug').eq('noindex', true)
    if (error || !Array.isArray(data)) return new Set()
    return new Set(data.map((row) => row.page_slug).filter(Boolean))
  } catch {
    return new Set()
  }
}

function dedupeEntries(entries) {
  const map = new Map()
  for (const entry of withoutRedirected(entries)) map.set(entry.url, entry)
  return Array.from(map.values())
}

// Single source of truth for the public sitemap. Both the native /sitemap.xml
// route and the Admin "Generate/Download" XML endpoint call this, so they can
// never drift into showing different URLs for the same published content.
export async function buildPublicSitemapEntries() {
  const makeEntry = (path, { lastModified, priority = 0.7, changeFrequency = 'weekly' } = {}) => ({
    url: `${SITE_URL}${path}`,
    lastModified: lastModified ? new Date(lastModified) : new Date(),
    changeFrequency,
    priority,
  })

  const entries = STATIC_ROUTES.map((route) => makeEntry(route.path, route))

  const supabase = getServerSupabaseClient()
  if (!supabase) return dedupeEntries(entries)

  // A list page with no active item is noindex (its page.jsx); leave it out until the first one is added.
  for (const [path, table] of Object.entries(LIST_PAGE_TABLES)) {
    if (await hasActiveRows(supabase, table)) continue
    const at = entries.findIndex((entry) => entry.url === `${SITE_URL}${path}`)
    if (at >= 0) entries.splice(at, 1)
  }

  const settings = await fetchSitemapSettings(supabase)
  const includePages = settings.include_pages !== false
  const includeBlogs = settings.include_blogs !== false
  const includeCourses = settings.include_courses !== false
  const includeCities = settings.include_cities !== false

  if (includePages) {
    const noindexSeoSlugs = await fetchNoindexSeoSlugs(supabase)
    const pages = await fetchSlugRows(supabase, 'pages', { eqFilters: [{ column: 'status', value: 'published' }], respectNoindex: true })
    for (const row of indexableRows(pages, noindexSeoSlugs)) {
      if (!row.slug) continue
      entries.push(makeEntry(getCanonicalPath('page', row.slug), {
        lastModified: row.updated_at,
        priority: settings.priority_pages ?? 0.8,
        changeFrequency: settings.changefreq_pages || 'weekly',
      }))
    }

    for (const row of await fetchSlugRows(supabase, 'location_pages', { eqFilters: [{ column: 'status', value: 'published' }], respectExcludeFlag: false })) {
      if (!row.slug) continue
      entries.push(makeEntry(getCanonicalPath('location_page', row.slug), {
        lastModified: row.updated_at,
        priority: settings.priority_pages ?? 0.8,
        changeFrequency: settings.changefreq_pages || 'weekly',
      }))
    }
  }

  if (includeBlogs) {
    try {
      // A noindex blog page (app/(public)/blog/[slug]) is not listed either.
      const blogs = indexableRows(await fetchPublishedPublicBlogs({ select: 'slug,published_at,updated_at,created_at,status,noindex', limit: 500 }))
      // WordPress (Acadvizen CMS) blogs never replace an existing Main blog address.
      const wordpressBlogs = (await fetchWordPressBlogsForMain()).filter((blog) => !blog.noindex)
      for (const blog of mergeBlogLists(blogs, wordpressBlogs)) {
        if (!blog?.slug) continue
        entries.push(makeEntry(getCanonicalPath('blog', blog.slug), {
          lastModified: blog.updated_at || blog.published_at,
          priority: settings.priority_blogs ?? 0.6,
          changeFrequency: settings.changefreq_blogs || 'weekly',
        }))
      }
    } catch {
      // Sitemap generation must not fail outright if the blog query has an issue.
    }
  }

  if (includePages) {
    // Pages designed in Elementor and published to the Main Website (Render Bridge).
    const manifest = await fetchBridgeManifest()
    for (const page of manifest?.pages || []) {
      if (page.noindex || (!page.replace && mainOwnedReason(page.path))) continue
      entries.push(makeEntry(page.path, {
        lastModified: page.updatedAt,
        priority: settings.priority_pages ?? 0.8,
        changeFrequency: settings.changefreq_pages || 'weekly',
      }))
    }
  }

  if (includeCourses) {
    for (const row of await fetchSlugRows(supabase, 'courses', { eqFilters: [{ column: 'is_active', value: true }] })) {
      if (!row.slug) continue
      entries.push(makeEntry(getCanonicalPath('course', row.slug), {
        lastModified: row.updated_at,
        priority: settings.priority_courses ?? 0.7,
        changeFrequency: settings.changefreq_courses || 'monthly',
      }))
    }
  }

  // Tools have no dedicated admin sitemap toggle - always included, matching the Tools listing itself.
  for (const row of await fetchSlugRows(supabase, 'tools_extended', { eqFilters: [{ column: 'is_active', value: true }], respectExcludeFlag: false })) {
    if (!row.slug) continue
    entries.push(makeEntry(getCanonicalPath('tool', row.slug), { lastModified: row.updated_at, priority: 0.7, changeFrequency: 'weekly' }))
  }

  if (includeCities) {
    for (const row of await fetchSlugRows(supabase, 'city_pages', { eqFilters: [{ column: 'is_active', value: true }] })) {
      if (!row.slug) continue
      entries.push(makeEntry(getCanonicalPath('city_page', row.slug), {
        lastModified: row.updated_at,
        priority: settings.priority_cities ?? 0.6,
        changeFrequency: settings.changefreq_cities || 'monthly',
      }))
    }

    // Legacy SEO landing table (no admin editor) - still a real published route, kept for parity.
    for (const row of await fetchSlugRows(supabase, 'cities', { eqFilters: [{ column: 'is_active', value: true }], respectExcludeFlag: false })) {
      if (!row.slug) continue
      entries.push(makeEntry(getCanonicalPath('city_course', row.slug), {
        lastModified: row.updated_at,
        priority: settings.priority_cities ?? 0.5,
        changeFrequency: settings.changefreq_cities || 'monthly',
      }))
    }
  }

  for (const row of await fetchSlugRows(supabase, 'blog_categories', { respectExcludeFlag: false })) {
    if (!row.slug) continue
    entries.push(makeEntry(getCanonicalPath('blog_category', row.slug), { priority: 0.6, changeFrequency: 'weekly' }))
  }
  for (const row of await fetchSlugRows(supabase, 'blog_tags', { respectExcludeFlag: false })) {
    if (!row.slug) continue
    entries.push(makeEntry(getCanonicalPath('blog_tag', row.slug), { priority: 0.6, changeFrequency: 'weekly' }))
  }
  // Only authors with published posts: an empty author page is noindex (app/(public)/blog/author/[slug]/page.jsx).
  const authorsWithPosts = await fetchAuthorIdsWithPublishedPosts(supabase)
  for (const row of await fetchAuthorRows(supabase)) {
    if (!row.slug || !authorsWithPosts.has(row.id)) continue
    entries.push(makeEntry(getCanonicalPath('author', row.slug), { priority: 0.5, changeFrequency: 'weekly' }))
  }

  for (const row of await fetchSlugRows(supabase, 'companies', { eqFilters: [{ column: 'is_active', value: true }], respectExcludeFlag: false })) {
    if (!row.slug) continue
    entries.push(makeEntry(getCanonicalPath('company', row.slug), { lastModified: row.updated_at, priority: 0.5, changeFrequency: 'monthly' }))
  }
  for (const row of await fetchSlugRows(supabase, 'internships', { eqFilters: [{ column: 'is_active', value: true }], respectExcludeFlag: false })) {
    if (!row.slug) continue
    entries.push(makeEntry(getCanonicalPath('internship', row.slug), { lastModified: row.updated_at, priority: 0.6, changeFrequency: 'weekly' }))
  }
  for (const row of await fetchSlugRows(supabase, 'locations', { eqFilters: [{ column: 'is_active', value: true }], respectExcludeFlag: false })) {
    if (!row.slug) continue
    entries.push(makeEntry(getCanonicalPath('location', row.slug), { lastModified: row.updated_at, priority: 0.5, changeFrequency: 'monthly' }))
  }
  for (const row of await fetchSlugRows(supabase, 'resources', { eqFilters: [{ column: 'is_active', value: true }], respectExcludeFlag: false })) {
    if (!row.slug) continue
    entries.push(makeEntry(getCanonicalPath('resource', row.slug), { lastModified: row.updated_at, priority: 0.5, changeFrequency: 'monthly' }))
  }
  for (const row of await fetchSlugRows(supabase, 'service_pages', { eqFilters: [{ column: 'is_active', value: true }], respectExcludeFlag: false })) {
    if (!row.slug) continue
    entries.push(makeEntry(getCanonicalPath('service_page', row.slug), { lastModified: row.updated_at, priority: 0.6, changeFrequency: 'monthly' }))
  }

  return dedupeEntries(entries)
}

export async function markSitemapGenerated(supabase) {
  try {
    await supabase.from('sitemap_settings').update({ last_generated: new Date().toISOString() })
  } catch {
    // Non-critical.
  }
}

export function entriesToXml(entries) {
  const body = entries
    .map((entry) => {
      const lastmod = entry.lastModified instanceof Date ? entry.lastModified.toISOString() : entry.lastModified
      return `  <url>
    <loc>${entry.url}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`
}
