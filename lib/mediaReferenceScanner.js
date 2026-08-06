// Shared media-reference scanner used by the media delete-guard and the admin
// "References" panel. Two passes:
//   1. DIRECT_CHECKS - plain text/url columns, matched with an exact `.eq()` filter.
//   2. JSON_CHECKS - jsonb columns (page/blog builder content, city/service page
//      arrays, reusable blocks, form fields, templates) that may embed a media URL
//      anywhere inside a nested object/array/HTML string, matched with `.textSearch`-
//      unsafe generic content, so these are fetched and walked in JS instead.
// A media item is only genuinely orphaned when both passes report zero matches.

const DIRECT_CHECKS = [
  { table: 'blogs', columns: ['featured_image', 'image', 'og_image'], label: 'Blog posts', titleColumn: 'title', linkColumn: 'slug', linkPrefix: '/admin/blogs' },
  { table: 'pages', columns: ['og_image'], label: 'Pages', titleColumn: 'title', linkColumn: 'slug', linkPrefix: '/admin/pages' },
  { table: 'city_pages', columns: ['hero_image_url', 'hero_video_url', 'about_image_url'], label: 'City pages', titleColumn: 'city_name', linkColumn: 'slug', linkPrefix: '/admin/cities' },
  { table: 'banners', columns: ['desktop_image', 'tablet_image', 'mobile_image'], label: 'Banners', titleColumn: 'name', linkPrefix: '/admin/banners' },
  { table: 'popups', columns: ['image_url'], label: 'Popups', titleColumn: 'name', linkPrefix: '/admin/popups' },
  { table: 'header_settings', columns: ['logo_url'], label: 'Header settings', linkPrefix: '/admin/header' },
  { table: 'footer_settings', columns: ['logo_url'], label: 'Footer settings', linkPrefix: '/admin/footer' },
]

const JSON_CHECKS = [
  { table: 'sections', columns: ['content_json', 'style_json'], label: 'Page sections', titleColumn: 'page_slug', extra: 'page_id, page_slug, type', linkPrefix: '/admin/pages' },
  { table: 'blogs', columns: ['content_json'], label: 'Blog post content', titleColumn: 'title', linkColumn: 'slug', linkPrefix: '/admin/blogs' },
  { table: 'pages', columns: ['content', 'sections_json'], label: 'Page content', titleColumn: 'title', linkColumn: 'slug', linkPrefix: '/admin/pages' },
  { table: 'city_pages', columns: ['gallery', 'testimonials', 'features', 'stats', 'faqs'], label: 'City page content', titleColumn: 'city_name', linkColumn: 'slug', linkPrefix: '/admin/cities' },
  { table: 'service_pages', columns: ['curriculum', 'benefits', 'faqs'], label: 'Service page content', titleColumn: 'title', linkColumn: 'slug', linkPrefix: '/admin/service-pages' },
  { table: 'page_templates', columns: ['template_data'], label: 'Page templates', titleColumn: 'name', linkPrefix: '/admin/templates' },
  { table: 'reusable_sections', columns: ['section_data'], label: 'Reusable sections', titleColumn: 'name', linkPrefix: '/admin/pages' },
  { table: 'reusable_blocks', columns: ['content_json', 'style_json'], label: 'Reusable blocks', titleColumn: 'name', linkPrefix: '/admin/pages' },
  { table: 'forms', columns: ['fields'], label: 'Forms', titleColumn: 'name', linkPrefix: '/admin/forms' },
  { table: 'home_sections', columns: ['items_json', 'cta_json'], label: 'Homepage sections', titleColumn: 'section_key', linkPrefix: '/admin/homepage' },
]

function deepContainsUrl(value, url) {
  if (value == null) return false
  if (typeof value === 'string') return value.includes(url)
  if (Array.isArray(value)) return value.some((entry) => deepContainsUrl(entry, url))
  if (typeof value === 'object') return Object.values(value).some((entry) => deepContainsUrl(entry, url))
  return false
}

function buildLink(check, row) {
  if (!check.linkPrefix) return null
  const slugLike = check.linkColumn ? row[check.linkColumn] : row.id
  return check.table === 'sections'
    ? `${check.linkPrefix}?page=${row.page_id || ''}`
    : `${check.linkPrefix}${slugLike ? `?id=${row.id}` : ''}`
}

export async function findMediaReferences(supabase, url) {
  if (!url) return []
  const matches = []

  for (const check of DIRECT_CHECKS) {
    try {
      const orFilter = check.columns.map((column) => `${column}.eq.${url}`).join(',')
      const select = ['id', check.titleColumn, check.linkColumn].filter(Boolean).join(', ') || 'id'
      const { data, error } = await supabase.from(check.table).select(select).or(orFilter).limit(10)
      if (error) {
        console.error(`[media] Direct reference check failed for ${check.table}`, error.message)
        continue
      }
      if (data?.length) {
        matches.push({
          table: check.table,
          label: check.label,
          count: data.length,
          items: data.map((row) => ({
            id: row.id,
            title: check.titleColumn ? row[check.titleColumn] : null,
            link: buildLink(check, row),
          })),
        })
      }
    } catch (checkError) {
      console.error(`[media] Direct reference check threw for ${check.table}`, checkError)
    }
  }

  for (const check of JSON_CHECKS) {
    try {
      const select = ['id', check.extra, check.titleColumn, check.linkColumn, ...check.columns]
        .filter(Boolean)
        .join(', ')
      const { data, error } = await supabase.from(check.table).select(select).limit(2000)
      if (error) {
        console.error(`[media] JSON reference check failed for ${check.table}`, error.message)
        continue
      }
      const hits = (data || []).filter((row) => check.columns.some((column) => deepContainsUrl(row[column], url)))
      if (hits.length) {
        matches.push({
          table: check.table,
          label: check.label,
          count: hits.length,
          items: hits.slice(0, 10).map((row) => ({
            id: row.id,
            title: check.titleColumn ? row[check.titleColumn] : null,
            link: buildLink(check, row),
          })),
        })
      }
    } catch (checkError) {
      console.error(`[media] JSON reference check threw for ${check.table}`, checkError)
    }
  }

  return matches
}
