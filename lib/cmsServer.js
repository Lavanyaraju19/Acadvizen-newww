import { getServerSupabaseClient } from './supabaseServer'

function isMissingRelation(error) {
  const msg = String(error?.message || '').toLowerCase()
  return msg.includes('relation') && msg.includes('does not exist')
}

export async function fetchCmsPageBySlug(slug, { preview = false } = {}) {
  const supabase = getServerSupabaseClient()
  if (!supabase || !slug) return null

  let pageQuery = supabase.from('pages').select('*').eq('slug', slug).limit(1)
  if (!preview) pageQuery = pageQuery.eq('status', 'published')
  const { data: pages, error: pageError } = await pageQuery
  if (pageError) {
    if (isMissingRelation(pageError)) return null
    return null
  }
  const page = Array.isArray(pages) ? pages[0] : null
  if (!page) return null

  let sectionQuery = supabase
    .from('sections')
    .select('*')
    .eq('page_id', page.id)
    .order('order_index', { ascending: true })
  if (!preview) sectionQuery = sectionQuery.eq('visibility', true)
  const { data: sections, error: sectionError } = await sectionQuery
  if (sectionError) {
    if (isMissingRelation(sectionError)) return { ...page, sections: [] }
    return { ...page, sections: [] }
  }

  return {
    ...page,
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

  let query = supabase.from('location_pages').select('*').eq('slug', slug).limit(1)
  if (!preview) query = query.eq('status', 'published')
  const { data, error } = await query
  if (error) {
    if (isMissingRelation(error)) return null
    return null
  }

  const row = Array.isArray(data) ? data[0] : null
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

export async function fetchRedirectByPath(pathname) {
  const supabase = getServerSupabaseClient()
  if (!supabase || !pathname) return null
  const { data, error } = await supabase
    .from('redirects')
    .select('*')
    .eq('from_path', pathname)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    if (isMissingRelation(error)) return null
    return null
  }
  return data || null
}
