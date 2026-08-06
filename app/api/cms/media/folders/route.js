import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
} from '../../_utils'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const unauthorized = await ensureAdmin(request, { resource: 'media', action: 'read' })
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { data, error } = await supabase
    .from('media_folders')
    .select('id, name, parent_id, created_at')
    .order('name', { ascending: true })

  if (error) return jsonError(`Failed to load folders: ${error.message}`, 500, [])
  return jsonOk(data || [])
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request, { resource: 'media', action: 'create' })
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  const name = String(body?.name || '').trim()
  if (!name) return jsonError('Folder name is required.', 400)

  const { data, error } = await supabase
    .from('media_folders')
    .insert({ name, parent_id: body?.parent_id || null })
    .select('id, name, parent_id, created_at')
    .single()

  if (error) {
    if (String(error.code) === '23505') {
      return jsonError('A folder with that name already exists in this location.', 409)
    }
    return jsonError(`Failed to create folder: ${error.message}`, 500)
  }
  return jsonOk(data)
}
