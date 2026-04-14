import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  isAdminRequest,
  jsonError,
  jsonOk,
  parsePositiveInt,
  readJsonBody,
} from '../_utils'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  if (!isAdminRequest(request)) return jsonError('Unauthorized admin request.', 401, [])

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const limit = parsePositiveInt(searchParams.get('limit'), 200)

  let query = supabase.from('media').select('*').order('created_at', { ascending: false }).limit(limit || 200)
  if (type) query = query.eq('type', type)
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
  if (!body?.url) return jsonError('url is required.', 400)

  const payload = {
    url: body.url,
    bucket: body.bucket || null,
    path: body.path || null,
    type: body.type || 'image',
    width: body.width ?? null,
    height: body.height ?? null,
    size: body.size ?? null,
    alt_text: body.alt_text || null,
    caption: body.caption || null,
  }

  const { data, error } = await supabase.from('media').insert(payload).select('*').single()
  if (error) return jsonError(`Failed to save media metadata: ${error.message}`, 200)
  return jsonOk(data)
}
