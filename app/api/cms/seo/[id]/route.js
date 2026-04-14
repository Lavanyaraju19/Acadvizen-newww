import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  normalizePagePath,
  revalidateAllCmsPages,
  revalidateCmsPaths,
  readJsonBody,
} from '../../_utils'

export const dynamic = 'force-dynamic'

export async function PATCH(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('SEO metadata id is required.', 400)

  const body = await readJsonBody(request)
  if (!body) return jsonError('Invalid request body.', 400)

  const update = {}
  const allowed = [
    'page_slug',
    'meta_title',
    'meta_description',
    'canonical_url',
    'og_title',
    'og_description',
    'og_image',
    'twitter_title',
    'twitter_description',
    'twitter_image',
    'noindex',
    'schema_json',
  ]
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }
  if ('schema_json' in update && (!update.schema_json || typeof update.schema_json !== 'object')) {
    update.schema_json = null
  }
  if ('noindex' in update) update.noindex = Boolean(update.noindex)

  const { data, error } = await supabase.from('seo_metadata').update(update).eq('id', id).select('*').single()
  if (error) return jsonError(`Failed to update SEO metadata: ${error.message}`, 200)
  revalidateCmsPaths([normalizePagePath(data?.page_slug)])
  revalidateAllCmsPages()
  return jsonOk(data)
}

export async function DELETE(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('SEO metadata id is required.', 400)

  const { data: seo } = await supabase.from('seo_metadata').select('page_slug').eq('id', id).maybeSingle()
  const { error } = await supabase.from('seo_metadata').delete().eq('id', id)
  if (error) return jsonError(`Failed to delete SEO metadata: ${error.message}`, 200)
  revalidateCmsPaths([normalizePagePath(seo?.page_slug)])
  revalidateAllCmsPages()
  return jsonOk({ id, deleted: true })
}
