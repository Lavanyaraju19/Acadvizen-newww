import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
  revalidateAllCmsPages,
} from '../../_utils'

export const dynamic = 'force-dynamic'

export async function PATCH(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  const { id } = params

  // Allowed fields for update
  const allowedFields = [
    'city_name',
    'slug',
    'hero_title',
    'hero_subtitle',
    'hero_description',
    'hero_image_url',
    'hero_video_url',
    'hero_cta_text',
    'hero_cta_link',
    'about_title',
    'about_description',
    'about_image_url',
    'features',
    'stats',
    'testimonials',
    'gallery',
    'faqs',
    'contact_phone',
    'contact_email',
    'contact_address',
    'google_maps_url',
    'seo_title',
    'seo_description',
    'meta_keywords',
    'og_image_url',
    'canonical_url',
    'is_active',
    'priority'
  ]

  const updateData = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field]
    }
  }

  const { data, error } = await supabase
    .from('city_pages')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return jsonError(`Failed to update city page: ${error.message}`, 500)
  revalidateAllCmsPages()
  return jsonOk(data)
}

export async function DELETE(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { id } = params

  const { error } = await supabase.from('city_pages').delete().eq('id', id)
  if (error) return jsonError(`Failed to delete city page: ${error.message}`, 500)
  
  revalidateAllCmsPages()
  return jsonOk({ deleted: true })
}