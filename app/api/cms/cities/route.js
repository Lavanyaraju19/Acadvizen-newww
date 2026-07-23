import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
  revalidateAllCmsPages,
} from '../_utils'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const includeDrafts = searchParams.get('include_drafts') === '1'
  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: includeDrafts })
  if (response) return response

  const limit = parseInt(searchParams.get('limit') || '100')

  let query = supabase.from('city_pages').select('*').order('priority', { ascending: true }).limit(limit)
  if (!includeDrafts) query = query.eq('is_active', true)

  const { data, error } = await query
  if (error) return jsonError(`Database query failed: ${error.message}`, 200, [])

  return jsonOk(data || [])
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  if (!body?.city_name) {
    return jsonError('City name is required.', 400)
  }

  // Generate slug from city name if not provided
  const slug = body.slug || body.city_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const payload = {
    id: body.id || undefined,
    city_name: String(body.city_name).trim(),
    slug,
    hero_title: body.hero_title || null,
    hero_subtitle: body.hero_subtitle || null,
    hero_description: body.hero_description || null,
    hero_image_url: body.hero_image_url || null,
    hero_video_url: body.hero_video_url || null,
    hero_cta_text: body.hero_cta_text || null,
    hero_cta_link: body.hero_cta_link || null,
    about_title: body.about_title || null,
    about_description: body.about_description || null,
    about_image_url: body.about_image_url || null,
    features: body.features || [],
    stats: body.stats || [],
    testimonials: body.testimonials || [],
    gallery: body.gallery || [],
    faqs: body.faqs || [],
    contact_phone: body.contact_phone || null,
    contact_email: body.contact_email || null,
    contact_address: body.contact_address || null,
    google_maps_url: body.google_maps_url || null,
    seo_title: body.seo_title || null,
    seo_description: body.seo_description || null,
    meta_keywords: body.meta_keywords || null,
    og_image_url: body.og_image_url || null,
    canonical_url: body.canonical_url || null,
    is_active: body.is_active !== false,
    priority: body.priority || 0,
  }

  const { data, error } = await supabase
    .from('city_pages')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) return jsonError(`Failed to save city page: ${error.message}`, 200)
  revalidateAllCmsPages()
  return jsonOk(data)
}