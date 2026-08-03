import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
  revalidateAllCmsPages,
} from '../../_utils'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { supabase, response } = await getSupabaseClientOrResponse(request)
  if (response) return response

  const { data, error } = await supabase
    .from('homepage_hero')
    .select('*')
    .single()

  if (error) {
    // If no data exists, return default values
    if (error.code === 'PGRST116') {
      return jsonOk({
        heading: 'Master AI-Powered Digital Marketing Course',
        subheading: 'Build Your Own Learning Path with Guidance from Global Industry Experts',
        video_url: null,
        video_title: null,
        video_autoplay: false,
        background_image: null,
        mobile_background_image: null,
        cta_text: 'Enroll Now',
        cta_link: '/courses',
        secondary_cta_text: null,
        secondary_cta_link: null,
        badge_text: '100% Job Guaranteed*',
        badge_color: '#10b981',
        show_hero: true,
      })
    }
    return jsonError(`Failed to fetch hero: ${error.message}`, 500)
  }

  return jsonOk(data)
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)

  const payload = {
    heading: String(body.heading || '').trim(),
    subheading: String(body.subheading || '').trim(),
    video_url: body.video_url || null,
    video_title: body.video_title || null,
    video_autoplay: Boolean(body.video_autoplay),
    background_image: body.background_image || null,
    mobile_background_image: body.mobile_background_image || null,
    cta_text: body.cta_text || null,
    cta_link: body.cta_link || null,
    secondary_cta_text: body.secondary_cta_text || null,
    secondary_cta_link: body.secondary_cta_link || null,
    badge_text: body.badge_text || null,
    badge_color: body.badge_color || '#10b981',
    show_hero: body.show_hero !== false,
  }

  // Check if hero exists
  const { data: existing } = await supabase
    .from('homepage_hero')
    .select('id')
    .limit(1)
    .single()

  let result
  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('homepage_hero')
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error) return jsonError(`Failed to update hero: ${error.message}`, 500)
    result = data
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('homepage_hero')
      .insert(payload)
      .select('*')
      .single()

    if (error) return jsonError(`Failed to create hero: ${error.message}`, 500)
    result = data
  }

  revalidateAllCmsPages()
  return jsonOk(result)
}
