import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  getOptionalAdminContext,
  jsonError,
  jsonOk,
  readJsonBody,
  revalidateCmsMutation,
} from '../_utils'
import {
  assertSlugAvailable,
  buildCmsMutationMeta,
  getCanonicalPublicUrl,
  normalizeCmsSlug,
} from '../../../../lib/cmsPublishing'

export const dynamic = 'force-dynamic'

function isTableNotFoundError(error) {
  if (!error) return false
  const msg = String(error.message || '').toLowerCase()
  return msg.includes('does not exist') || msg.includes('relation') || msg.includes('42p01') || msg.includes('could not find the table') || msg.includes('schema cache')
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const wantsDrafts = searchParams.get('include_drafts') === '1'
    const adminAccess = wantsDrafts
      ? await getOptionalAdminContext(request, { resource: 'pages', action: 'read' })
      : { context: null, response: null }
    if (adminAccess.response) return adminAccess.response
    const includeDrafts = Boolean(adminAccess.context)

    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: includeDrafts })
    if (response) return response

    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabase.from('city_pages').select('*').order('priority', { ascending: true }).limit(limit)
    if (!includeDrafts) query = query.eq('is_active', true)

    const { data, error } = await query
    if (error) {
      if (isTableNotFoundError(error)) return jsonOk([])
      return jsonError(`Database query failed: ${error.message}`, 500, [])
    }

    return jsonOk(data || [])
  } catch (err) {
    return jsonError(`Internal server error: ${err.message}`, 500, [])
  }
}

export async function POST(request) {
  try {
    const unauthorized = await ensureAdmin(request)
    if (unauthorized) return unauthorized

    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response

    const body = await readJsonBody(request)
    if (!body?.city_name) {
      return jsonError('City name is required.', 400)
    }

    const slug = normalizeCmsSlug(body.slug || body.city_name)
    if (!slug) return jsonError('Slug is required.', 400)

    try {
      await assertSlugAvailable(supabase, {
        table: 'city_pages',
        slug,
        currentId: body.id || '',
        contentType: 'city page',
      })
    } catch (error) {
      return jsonError(error.message, error.status || 500)
    }

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

    if (error) {
      if (isTableNotFoundError(error)) return jsonError('Database table not yet created. Run migrations first.', 503)
      return jsonError(`Failed to save city page: ${error.message}`, 500)
    }
    const revalidation = revalidateCmsMutation('city_page', {
      slug: data?.slug,
      extraPaths: [`/digital-marketing-course-in-${data?.slug}`, '/sitemap.xml'],
    })
    const responseData = {
      ...data,
      canonical_public_url: getCanonicalPublicUrl('city_page', data?.slug),
    }
    const publication = buildCmsMutationMeta('city_page', responseData, revalidation)
    if (!revalidation.ok) {
      return jsonError('City page saved, but cache revalidation failed. Please retry publishing.', 500, responseData)
    }
    return jsonOk(responseData, { publication })
  } catch (err) {
    return jsonError(`Internal server error: ${err.message}`, 500)
  }
}
