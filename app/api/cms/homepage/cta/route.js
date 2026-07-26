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
  const { supabase, response } = getSupabaseClientOrResponse(request)
  if (response) return response

  const { data, error } = await supabase
    .from('homepage_cta')
    .select('*')
    .single()

  if (error) {
    // If no data exists, return default values
    if (error.code === 'PGRST116') {
      return jsonOk({
        heading: 'Ready to Start Your Journey?',
        subheading: 'Join thousands of students who have transformed their careers with our courses',
        primary_cta_text: 'Enroll Now',
        primary_cta_link: '/courses',
        secondary_cta_text: 'Learn More',
        secondary_cta_link: '/about',
        background_image: null,
        show_cta: true,
      })
    }
    return jsonError(`Failed to fetch CTA: ${error.message}`, 500)
  }

  return jsonOk(data)
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)

  const payload = {
    heading: String(body.heading || '').trim(),
    subheading: String(body.subheading || '').trim(),
    primary_cta_text: body.primary_cta_text || null,
    primary_cta_link: body.primary_cta_link || null,
    secondary_cta_text: body.secondary_cta_text || null,
    secondary_cta_link: body.secondary_cta_link || null,
    background_image: body.background_image || null,
    show_cta: body.show_cta !== false,
  }

  // Check if CTA exists
  const { data: existing } = await supabase
    .from('homepage_cta')
    .select('id')
    .limit(1)
    .single()

  let result
  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('homepage_cta')
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error) return jsonError(`Failed to update CTA: ${error.message}`, 500)
    result = data
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('homepage_cta')
      .insert(payload)
      .select('*')
      .single()

    if (error) return jsonError(`Failed to create CTA: ${error.message}`, 500)
    result = data
  }

  revalidateAllCmsPages()
  return jsonOk(result)
}
