import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  isAdminRequest,
  jsonError,
  jsonOk,
  normalizePagePath,
  parsePositiveInt,
  revalidateAllCmsPages,
  revalidateCmsPaths,
  readJsonBody,
} from '../_utils'

export const dynamic = 'force-dynamic'

async function resolvePageId(supabase, pageSlug) {
  if (!pageSlug) return null
  const { data, error } = await supabase.from('pages').select('id').eq('slug', pageSlug).maybeSingle()
  if (error) return null
  return data?.id || null
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const includeHidden = searchParams.get('include_hidden') === '1' && isAdminRequest(request)
  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: includeHidden })
  if (response) return response

  const pageId = searchParams.get('page_id')
  const pageSlug = searchParams.get('page_slug')
  const limit = parsePositiveInt(searchParams.get('limit'), 500)

  let resolvedPageId = pageId
  if (!resolvedPageId && pageSlug) {
    resolvedPageId = await resolvePageId(supabase, pageSlug)
  }

  let query = supabase.from('sections').select('*').order('order_index', { ascending: true }).limit(limit || 500)
  if (resolvedPageId) query = query.eq('page_id', resolvedPageId)
  if (!includeHidden) query = query.eq('visibility', true)

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
  if (!body) return jsonError('Invalid request body.', 400)

  if (body.action === 'duplicate' && body.id) {
    const { data: source, error: sourceError } = await supabase.from('sections').select('*').eq('id', body.id).single()
    if (sourceError) return jsonError(`Source section not found: ${sourceError.message}`, 404)

    const duplicate = {
      page_id: source.page_id,
      type: source.type,
      order_index: Number(source.order_index || 0) + 1,
      content_json: source.content_json || {},
      style_json: source.style_json || {},
      visibility: source.visibility !== false,
    }
    const { data, error } = await supabase.from('sections').insert(duplicate).select('*').single()
    if (error) return jsonError(`Failed to duplicate section: ${error.message}`, 200)
    const { data: page } = await supabase.from('pages').select('slug').eq('id', source.page_id).maybeSingle()
    revalidateCmsPaths([normalizePagePath(page?.slug)])
    revalidateAllCmsPages()
    return jsonOk(data)
  }

  if (!body.page_id || !body.type) {
    return jsonError('page_id and type are required.', 400)
  }

  const payload = {
    page_id: body.page_id,
    type: body.type,
    order_index: parsePositiveInt(body.order_index, 0),
    content_json: body.content_json && typeof body.content_json === 'object' ? body.content_json : {},
    style_json: body.style_json && typeof body.style_json === 'object' ? body.style_json : {},
    visibility: body.visibility !== false,
  }

  const { data, error } = await supabase
    .from('sections')
    .insert(payload)
    .select('*')
    .single()

  if (error) return jsonError(`Failed to create section: ${error.message}`, 200)
  const { data: page } = await supabase.from('pages').select('slug').eq('id', payload.page_id).maybeSingle()
  revalidateCmsPaths([normalizePagePath(page?.slug)])
  revalidateAllCmsPages()
  return jsonOk(data)
}
