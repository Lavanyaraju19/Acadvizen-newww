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
    .from('homepage_cta')
    .select('*')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return jsonOk({
        title: 'Ready to Start Your Journey?',
        description: 'Join thousands of students who have transformed their careers with our courses',
        button_text: 'Enroll Now',
        button_link: '/courses',
        background_color: '#050b12',
        text_color: '#ffffff',
        is_active: true,
      })
    }
    return jsonError(`Failed to fetch CTA: ${error.message}`, 500)
  }

  return jsonOk(data)
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)

  // Map to actual DB column names from base migration (20260128_phase1_hybrid_cms_base.sql)
  const payload = {
    title: String(body.title || body.heading || '').trim(),
    description: String(body.description || body.subheading || '').trim(),
    button_text: body.button_text || body.primary_cta_text || 'Get Started',
    button_link: body.button_link || body.primary_cta_link || '/courses',
    background_color: body.background_color || '#050b12',
    text_color: body.text_color || '#ffffff',
    is_active: body.is_active !== undefined ? Boolean(body.is_active) : (body.show_cta !== false),
  }

  const { data: existing } = await supabase
    .from('homepage_cta')
    .select('id')
    .limit(1)
    .single()

  let result
  if (existing) {
    const { data, error } = await supabase
      .from('homepage_cta')
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error) return jsonError(`Failed to update CTA: ${error.message}`, 500)
    result = data
  } else {
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
