import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  parsePositiveInt,
  readJsonBody,
} from '../_utils'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const unauthorized = await ensureAdmin(request, { resource: 'media', action: 'read' })
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const folder = searchParams.get('folder')
  const folderId = searchParams.get('folder_id')
  const limit = parsePositiveInt(searchParams.get('limit'), 200)

  let query = supabase.from('media').select('*').order('created_at', { ascending: false }).limit(limit || 200)
  if (type) query = query.eq('type', type)
  if (folder) query = query.eq('folder', folder)
  if (folderId === 'none') query = query.is('folder_id', null)
  else if (folderId) query = query.eq('folder_id', folderId)
  const { data, error } = await query

  if (error) return jsonError(`Database query failed: ${error.message}`, 500, [])
  return jsonOk(data || [])
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  if (!body?.url) return jsonError('url is required.', 400)

  // Validate media type
  const allowedTypes = ['image', 'video', 'document', 'audio']
  const mediaType = body.type || 'image'
  if (!allowedTypes.includes(mediaType)) {
    return jsonError(`Invalid media type. Must be one of: ${allowedTypes.join(', ')}`, 400)
  }

  const payload = {
    url: body.url,
    bucket: body.bucket || null,
    path: body.path || null,
    type: mediaType,
    width: body.width ?? null,
    height: body.height ?? null,
    size: body.size ?? null,
    alt_text: body.alt_text || null,
    caption: body.caption || null,
    folder: body.folder || null,
    folder_id: body.folder_id || null,
    name: body.name || null,
    tags: Array.isArray(body.tags) ? body.tags : [],
  }

  const { data, error } = await supabase.from('media').insert(payload).select('*').single()
  if (error) return jsonError(`Failed to save media metadata: ${error.message}`, 500)
  return jsonOk(data)
}
