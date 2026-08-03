import { getServerSupabaseClient } from './supabaseServer'
import { getCanonicalPath } from './cmsPublishing.js'
import { fetchPublishedPublicBlogs } from './publicBlogData.js'

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://acadvizen.com').replace(/\/+$/, '')

const STATIC_ROUTES = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/about', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/achievements', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/contact', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/blog', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/courses', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/tools', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/placement', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/testimonials', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/projects', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/soft-skills', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/hire-from-us', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/privacy-policy', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/terms-of-service', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/digital-marketing-course-in-bangalore', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/digital-marketing-course-in-jayanagar', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/seo-course-in-bangalore', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/social-media-marketing-course-in-bangalore', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/google-ads-course-in-bangalore', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/ai-digital-marketing-course', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/digital-marketing-internship-in-bangalore', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/companies', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/internships', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/resources', priority: 0.6, changeFrequency: 'weekly' },
]

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
async function fetchSlugRows(supabase, table, { eqFilters = [], respectExcludeFlag = true } = {}) {
  const runQuery = async (withExcludeFilter) => {
    let query = supabase.from(table).select('slug, updated_at')
    for (const filter of eqFilters) query = query.eq(filter.column, filter.value)
    if (withExcludeFilter && respectExcludeFlag) query = query.neq('exclude_from_sitemap', true)
    return query
  }

  try {
    let { data, error } = await runQuery(true)
    if (error && /exclude_from_sitemap/i.test(error.message || '')) {
      ;({ data, error } = await runQuery(false))
    }
    if (error) return []
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function dedupeEntries(entries) {
  const map = new Map()
  for (const entry of entries) map.set(entry.url, entry)
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

  const settings = await fetchSitemapSettings(supabase)
  const includePages = settings.include_pages !== false
  const includeBlogs = settings.include_blogs !== false
  const includeCourses = settings.include_courses !== false
  const includeCities = settings.include_cities !== false

  if (includePages) {
    for (const row of await fetchSlugRows(supabase, 'pages', { eqFilters: [{ column: 'status', value: 'published' }] })) {
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
      const blogs = await fetchPublishedPublicBlogs({ select: 'slug,published_at,updated_at,created_at,status', limit: 500 })
      for (const blog of blogs) {
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
  for (const row of await fetchSlugRows(supabase, 'authors', { respectExcludeFlag: false })) {
    if (!row.slug) continue
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
