import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
  revalidateCmsMutation,
} from '../../_utils'
import { createSlugRedirectRecord } from '../../../../../lib/redirects'
import {
  assertSlugAvailable,
  buildCmsMutationMeta,
  getCanonicalPublicUrl,
  normalizeCmsSlug,
} from '../../../../../lib/cmsPublishing'

export const dynamic = 'force-dynamic'

export async function PATCH(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  const { id } = params

  const { data: existingCity, error: existingCityError } = await supabase
    .from('city_pages')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (existingCityError) return jsonError(`Failed to load city page: ${existingCityError.message}`, 500)
  if (!existingCity) return jsonError('City page not found.', 404)

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

  if ('slug' in updateData || (!existingCity.slug && updateData.city_name)) {
    const nextSlug = normalizeCmsSlug(updateData.slug || updateData.city_name || existingCity.city_name)
    if (!nextSlug) return jsonError('Slug is required.', 400)
    try {
      await assertSlugAvailable(supabase, {
        table: 'city_pages',
        slug: nextSlug,
        currentId: id,
        contentType: 'city page',
      })
    } catch (error) {
      return jsonError(error.message, error.status || 500)
    }
    updateData.slug = nextSlug
  }

  const { data, error } = await supabase
    .from('city_pages')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return jsonError(`Failed to update city page: ${error.message}`, 500)

  let warning = null
  if (existingCity.slug && data?.slug && existingCity.slug !== data.slug && (existingCity.is_active || data.is_active)) {
    try {
      await createSlugRedirectRecord(supabase, {
        fromPath: `/digital-marketing-course-in-${existingCity.slug}`,
        toPath: `/digital-marketing-course-in-${data.slug}`,
        statusCode: 301,
      })
    } catch (redirectError) {
      warning = `City page updated, but the slug redirect could not be created: ${redirectError.message}`
    }
  }

  const revalidation = revalidateCmsMutation('city_page', {
    slug: data?.slug,
    previousSlug: existingCity.slug,
    extraPaths: [
      `/digital-marketing-course-in-${existingCity.slug}`,
      `/digital-marketing-course-in-${data?.slug}`,
      '/sitemap.xml',
    ],
  })
  const responseData = {
    ...data,
    canonical_public_url: getCanonicalPublicUrl('city_page', data?.slug),
  }
  const publication = buildCmsMutationMeta('city_page', responseData, revalidation)
  if (!revalidation.ok) {
    return jsonError('City page updated, but cache revalidation failed. Please retry publishing.', 500, responseData)
  }
  return jsonOk(responseData, { publication, ...(warning ? { warning } : {}) })
}

export async function DELETE(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { id } = params

  const { data: city } = await supabase.from('city_pages').select('slug').eq('id', id).maybeSingle()
  const { error } = await supabase.from('city_pages').delete().eq('id', id)
  if (error) return jsonError(`Failed to delete city page: ${error.message}`, 500)

  const revalidation = revalidateCmsMutation('city_page', {
    previousSlug: city?.slug,
    extraPaths: [`/digital-marketing-course-in-${city?.slug}`, '/sitemap.xml'],
  })
  if (!revalidation.ok) {
    return jsonError('City page deleted, but cache revalidation failed. Please retry.', 500, { deleted: true })
  }
  return jsonOk({ deleted: true }, { revalidation })
}
