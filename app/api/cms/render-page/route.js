import { getSupabaseClientOrResponse, isAdminRequest, jsonError, jsonOk } from '../_utils'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { supabase, response } = getSupabaseClientOrResponse()
  if (response) return response

  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const preview = searchParams.get('preview') === '1' && isAdminRequest(request)

  if (!slug) return jsonError('slug is required.', 400)

  let pageQuery = supabase.from('pages').select('*').eq('slug', slug).limit(1)
  if (!preview) pageQuery = pageQuery.eq('status', 'published')
  const { data: pages, error: pageError } = await pageQuery
  if (pageError) return jsonError(`Failed to load page: ${pageError.message}`, 200)
  const page = Array.isArray(pages) ? pages[0] : null
  if (!page) {
    let locationQuery = supabase.from('location_pages').select('*').eq('slug', slug).limit(1)
    if (!preview) locationQuery = locationQuery.eq('status', 'published')
    const { data: locationData, error: locationError } = await locationQuery
    if (locationError && !String(locationError.message || '').toLowerCase().includes('does not exist')) {
      return jsonError(`Failed to load location page: ${locationError.message}`, 200)
    }
    const locationPage = Array.isArray(locationData) ? locationData[0] : null
    if (!locationPage) return jsonOk(null)
    const sections = Array.isArray(locationPage.sections_json)
      ? locationPage.sections_json.map((section, index) => ({
          id: section?.id || `location-${locationPage.id}-${index}`,
          page_id: locationPage.id,
          type: section?.type || 'custom_rich_text',
          order_index: Number(section?.order_index ?? index),
          content_json: section?.content_json && typeof section.content_json === 'object' ? section.content_json : {},
          style_json: section?.style_json && typeof section.style_json === 'object' ? section.style_json : {},
          visibility: section?.visibility !== false,
        }))
      : []
    return jsonOk({ ...locationPage, sections, source: 'location_page' })
  }

  let sectionQuery = supabase
    .from('sections')
    .select('*')
    .eq('page_id', page.id)
    .order('order_index', { ascending: true })
  if (!preview) sectionQuery = sectionQuery.eq('visibility', true)
  const { data: sections, error: sectionsError } = await sectionQuery
  if (sectionsError) return jsonError(`Failed to load sections: ${sectionsError.message}`, 200)

  return jsonOk({ ...page, sections: sections || [] })
}
