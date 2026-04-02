import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  normalizePagePath,
  parsePositiveInt,
  revalidateAllCmsPages,
  revalidateCmsPaths,
  readJsonBody,
} from '../_utils'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { supabase, response } = getSupabaseClientOrResponse()
  if (response) return response

  const { searchParams } = new URL(request.url)
  const pageSlug = searchParams.get('page_slug')
  const limit = parsePositiveInt(searchParams.get('limit'), 300)

  let query = supabase
    .from('seo_metadata')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit || 300)
  if (pageSlug) query = query.eq('page_slug', pageSlug)

  const { data, error } = await query
  if (error) return jsonError(`Database query failed: ${error.message}`, 200, [])
  return jsonOk(data || [])
}

export async function POST(request) {
  const unauthorized = ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse()
  if (response) return response

  const body = await readJsonBody(request)
  if (!body?.page_slug) return jsonError('page_slug is required.', 400)

  const payload = {
    id: body.id || undefined,
    page_slug: body.page_slug,
    meta_title: body.meta_title || null,
    meta_description: body.meta_description || null,
    canonical_url: body.canonical_url || null,
    og_title: body.og_title || null,
    og_description: body.og_description || null,
    og_image: body.og_image || null,
    twitter_title: body.twitter_title || null,
    twitter_description: body.twitter_description || null,
    twitter_image: body.twitter_image || null,
    noindex: body.noindex === true,
    schema_json: body.schema_json && typeof body.schema_json === 'object' ? body.schema_json : null,
  }

  const { data, error } = await supabase
    .from('seo_metadata')
    .upsert(payload, { onConflict: 'page_slug' })
    .select('*')
    .single()

  if (error) return jsonError(`Failed to save SEO metadata: ${error.message}`, 200)
  revalidateCmsPaths([normalizePagePath(data?.page_slug)])
  revalidateAllCmsPages()
  return jsonOk(data)
}
