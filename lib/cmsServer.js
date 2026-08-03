import { getServerSupabaseClient } from './supabaseServer'
import { fetchRedirectByPathRecord } from './redirects.js'
import {
  fetchPublishedRecordBySlug,
  normalizeCmsSlug,
  resolvePublicCmsRecordBySlug,
} from './cmsPublishing.js'

function isMissingRelation(error) {
  const msg = String(error?.message || '').toLowerCase()
  return msg.includes('relation') && msg.includes('does not exist')
}

// city_page's canonical route (lib/cmsPublishing.js CMS_CONTENT_TYPES.city_page) is
// /digital-marketing-course-in-{slug}, i.e. a static prefix plus the record's own slug -
// but Next.js resolves that whole path through this /[slug] catch-all instead of the
// more-specific-looking `digital-marketing-course-in-[city]` sibling folder (a single
// dynamic segment wins over the other static-prefixed dynamic folders here), so without
// this, the prefix would just be treated as part of one opaque slug and never match any
// city_pages row. Longest/most-specific prefix must be checked first since
// "digital-marketing-course-in-x" also satisfies the shorter "digital-marketing-course-"
// prefix.
// locations' canonical route (lib/cmsPublishing.js CMS_CONTENT_TYPES.location) is
// /digital-marketing-courses-{slug} - a dedicated app/digital-marketing-courses-[location]/
// page.jsx folder existed for this, but the same single-dynamic-segment-wins precedence rule
// documented above for city_page made it completely unreachable too. Unlike city_page, this
// route is a deliberately permissive programmatic-SEO template that always renders (generic
// content for any slug, real content when an admin record exists) rather than 404ing, so its
// resolution below never fails once the prefix matches.
// city_course (lib/cmsPublishing.js CMS_CONTENT_TYPES.city_course) is /digital-marketing-course-{slug}
// (no "in-") - a legacy programmatic-SEO route backed by a `cities` table that has no admin
// editor. Same unreachable-route bug, same "always render" contract as location. Must be
// listed LAST: "digital-marketing-course-in-x" and "digital-marketing-courses-x" both also
// satisfy this shorter "digital-marketing-course-" prefix, so the more specific patterns need
// first refusal.
const PREFIXED_SLUG_PATTERNS = [
  { prefix: 'digital-marketing-course-in-', contentType: 'city_page' },
  { prefix: 'digital-marketing-courses-', contentType: 'location' },
  { prefix: 'digital-marketing-course-', contentType: 'city_course' },
]

export async function fetchCmsPageBySlug(slug, { preview = false } = {}) {
  const supabase = getServerSupabaseClient()
  if (!supabase || !slug) return null

  const normalizedSlug = normalizeCmsSlug(slug)
  // city_page is deliberately excluded here: it is only resolvable through the prefix-match
  // fallback below, so its content answers at exactly one URL (its canonical
  // /digital-marketing-course-in-{slug}) rather than also at the bare /{slug}.
  const resolved = await resolvePublicCmsRecordBySlug(supabase, {
    slug: normalizedSlug,
    contentTypes: ['page', 'location_page', 'service_page'],
    requestedRoute: `/${normalizedSlug}`,
    preview,
  })

  let finalResolved = resolved
  if (!finalResolved?.record) {
    for (const { prefix, contentType } of PREFIXED_SLUG_PATTERNS) {
      if (!normalizedSlug.startsWith(prefix)) continue
      const remainder = normalizedSlug.slice(prefix.length)
      if (!remainder) continue

      if (contentType === 'location') {
        // Always resolves once the prefix matches - a missing/unpublished admin record just
        // means the renderer falls back to fully generic, slug-derived content instead of 404ing.
        const { data } = await supabase
          .from('locations')
          .select('*')
          .eq('slug', remainder)
          .eq('is_active', true)
          .limit(1)
        finalResolved = { contentType, record: { ...(data?.[0] || {}), locationSlug: remainder } }
        break
      }

      if (contentType === 'city_course') {
        // Same "always resolve" contract as location - the `cities` table has no admin editor,
        // so a missing row just means the renderer falls back to generic, slug-derived content.
        const { data } = await supabase.from('cities').select('*').eq('slug', remainder).limit(1)
        finalResolved = { contentType, record: { ...(data?.[0] || {}), citySlug: remainder } }
        break
      }

      const prefixMatch = await resolvePublicCmsRecordBySlug(supabase, {
        slug: remainder,
        contentTypes: [contentType],
        requestedRoute: `/${normalizedSlug}`,
        preview,
      })
      if (prefixMatch?.record) {
        finalResolved = prefixMatch
      }
      // Stop at the first prefix whose STRING matched, whether or not a published record was
      // found. Without this, a draft/unpublished city_page slug (e.g. "...-in-mycity") would
      // fall through to the shorter, always-resolving "digital-marketing-course-" (city_course)
      // pattern below it and incorrectly render generic content / return 200 instead of 404 -
      // "...-in-mycity" is unambiguously a city_page slug regardless of its publish state.
      break
    }
  }

  if (!finalResolved?.record) return null

  const { contentType, record } = finalResolved

  if (contentType === 'city_page') {
    return {
      id: record.id,
      title: record.hero_title || record.city_name,
      slug: record.slug,
      seo_title: record.seo_title,
      seo_description: record.seo_description || record.hero_description,
      canonical_url: record.canonical_url,
      og_image: record.og_image_url,
      status: record.is_active ? 'published' : 'draft',
      sections: [],
      source: 'city_page',
      raw: record,
    }
  }

  if (contentType === 'location') {
    return {
      id: record.id || null,
      title: record.meta_title || record.name || null,
      slug: record.slug || record.locationSlug,
      seo_title: record.meta_title,
      seo_description: record.meta_description,
      status: 'published',
      sections: [],
      source: 'location',
      raw: record,
    }
  }

  if (contentType === 'service_page') {
    return {
      id: record.id,
      title: record.meta_title || record.title,
      slug: record.slug,
      seo_title: record.meta_title,
      seo_description: record.meta_description,
      status: record.is_active ? 'published' : 'draft',
      sections: [],
      source: 'service_page',
      raw: record,
    }
  }

  if (contentType === 'city_course') {
    return {
      id: record.id || null,
      title: record.name || null,
      slug: record.slug || record.citySlug,
      seo_title: null,
      seo_description: record.description,
      status: 'published',
      sections: [],
      source: 'city_course',
      raw: record,
    }
  }

  if (contentType === 'location_page') {
    const sections = Array.isArray(record.sections_json)
      ? record.sections_json.map((section, index) => ({
          id: section?.id || `location-${record.id}-${index}`,
          page_id: record.id,
          type: section?.type || 'custom_rich_text',
          order_index: Number(section?.order_index ?? index),
          content_json: section?.content_json && typeof section.content_json === 'object' ? section.content_json : {},
          style_json: section?.style_json && typeof section.style_json === 'object' ? section.style_json : {},
          visibility: section?.visibility !== false,
        }))
      : []

    return {
      id: record.id,
      title: record.title,
      slug: record.slug,
      description: record.description,
      seo_title: record.seo_title,
      seo_description: record.seo_description,
      canonical_url: record.canonical_url,
      og_image: record.og_image,
      noindex: record.noindex,
      status: record.status,
      sections,
      source: 'location_page',
      raw: record,
    }
  }

  let sectionQuery = supabase
    .from('sections')
    .select('*')
    .eq('page_id', record.id)
    .order('order_index', { ascending: true })
  if (!preview) sectionQuery = sectionQuery.eq('visibility', true)
  const { data: sections, error: sectionError } = await sectionQuery
  if (sectionError) {
    if (isMissingRelation(sectionError)) return { ...record, sections: [] }
    console.error('[cms-public] CMS page sections query failed.', {
      content_type: contentType,
      record_id: record.id,
      slug: normalizedSlug,
      supabase_error_code: sectionError?.code,
      reason: sectionError?.message,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    })
    throw sectionError
  }

  return {
    ...record,
    sections: Array.isArray(sections) ? sections : [],
  }
}

export async function fetchFirstPublishedCmsPage() {
  const supabase = getServerSupabaseClient()
  if (!supabase) return null

  const { data: pages, error } = await supabase
    .from('pages')
    .select('*')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(1)

  if (error) {
    if (isMissingRelation(error)) return null
    return null
  }

  const page = Array.isArray(pages) ? pages[0] : null
  if (!page) return null

  const { data: sections } = await supabase
    .from('sections')
    .select('*')
    .eq('page_id', page.id)
    .eq('visibility', true)
    .order('order_index', { ascending: true })

  return {
    ...page,
    sections: Array.isArray(sections) ? sections : [],
  }
}

export async function fetchCmsPageByAnySlug(slugs = [], { preview = false } = {}) {
  const candidates = Array.isArray(slugs) ? slugs : [slugs]
  for (const slug of candidates) {
    const page = await fetchCmsPageBySlug(slug, { preview })
    if (page) return page
  }
  return null
}

export async function fetchLocationPageBySlug(slug, { preview = false } = {}) {
  const supabase = getServerSupabaseClient()
  if (!supabase || !slug) return null

  const normalizedSlug = normalizeCmsSlug(slug)
  const row = await fetchPublishedRecordBySlug(supabase, {
    table: 'location_pages',
    slug: normalizedSlug,
    contentType: 'location_page',
    requestedRoute: `/${normalizedSlug}`,
    preview,
  })
  if (!row) return null

  const sections = Array.isArray(row.sections_json)
    ? row.sections_json.map((section, index) => ({
        id: section?.id || `location-${row.id}-${index}`,
        page_id: row.id,
        type: section?.type || 'custom_rich_text',
        order_index: Number(section?.order_index ?? index),
        content_json: section?.content_json && typeof section.content_json === 'object' ? section.content_json : {},
        style_json: section?.style_json && typeof section.style_json === 'object' ? section.style_json : {},
        visibility: section?.visibility !== false,
      }))
    : []

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    canonical_url: row.canonical_url,
    og_image: row.og_image,
    noindex: row.noindex,
    status: row.status,
    sections,
    source: 'location_page',
    raw: row,
  }
}

export async function fetchCmsSiteData() {
  const supabase = getServerSupabaseClient()
  if (!supabase) {
    return { settings: null, menus: {} }
  }

  const [{ data: settings }, { data: menus }, { data: navMenus, error: navMenuError }] = await Promise.all([
    supabase.from('site_settings').select('*').eq('id', 'default').maybeSingle(),
    supabase
      .from('menus')
      .select('*')
      .eq('is_active', true)
      .order('menu_location', { ascending: true })
      .order('order_index', { ascending: true }),
    supabase
      .from('navigation_menus')
      .select('*')
      .eq('is_active', true)
      .order('location', { ascending: true })
      .order('order_index', { ascending: true }),
  ])

  const mergedMenus = Array.isArray(menus) && menus.length
    ? menus.map((item) => ({ ...item, menu_location: item.menu_location || 'header' }))
    : (navMenuError ? [] : (navMenus || []).map((item) => ({ ...item, menu_location: item.location || 'header' })))

  const groupedMenus = mergedMenus.reduce((acc, item) => {
    const key = item.menu_location || 'header'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return { settings: settings || null, menus: groupedMenus }
}

export async function fetchSeoBySlug(slug) {
  const supabase = getServerSupabaseClient()
  if (!supabase || !slug) return null
  const { data } = await supabase.from('seo_metadata').select('*').eq('page_slug', slug).maybeSingle()
  return data || null
}

// seo_metadata rows are keyed by the bare slug string rather than a page id,
// so they must be actively migrated/cleared when a slug is renamed or freed -
// otherwise stale SEO metadata (title/description/schema) silently attaches
// itself to whatever unrelated content next occupies that slug.
export async function reassignSeoMetadataSlug(supabase, { fromSlug, toSlug }) {
  if (!supabase || !fromSlug || !toSlug || fromSlug === toSlug) return
  const { data: existing } = await supabase.from('seo_metadata').select('id').eq('page_slug', fromSlug).maybeSingle()
  if (!existing?.id) return
  const { data: conflict } = await supabase.from('seo_metadata').select('id').eq('page_slug', toSlug).maybeSingle()
  if (conflict?.id) return
  await supabase.from('seo_metadata').update({ page_slug: toSlug }).eq('id', existing.id)
}

export async function clearSeoMetadataForSlug(supabase, slug) {
  if (!supabase || !slug) return
  await supabase.from('seo_metadata').delete().eq('page_slug', slug)
}

export async function fetchRedirectByPath(pathname) {
  const supabase = getServerSupabaseClient()
  if (!supabase || !pathname) return null
  try {
    return await fetchRedirectByPathRecord(supabase, pathname)
  } catch (error) {
    if (isMissingRelation(error)) return null
    return null
  }
}
