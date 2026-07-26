import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
  revalidateAllCmsPages,
} from '../_utils'

export const dynamic = 'force-dynamic'

// GET all drafts for a user
export async function GET(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { searchParams } = new URL(request.url)
  const entityType = searchParams.get('entity_type')
  const entityId = searchParams.get('entity_id')

  let query = supabase
    .from('drafts')
    .select('*')
    .order('updated_at', { ascending: false })

  if (entityType) query = query.eq('entity_type', entityType)
  if (entityId) query = query.eq('entity_id', entityId)

  const { data, error } = await query
  if (error) return jsonError(`Failed to fetch drafts: ${error.message}`, 500)

  return jsonOk(data || [])
}

// POST create or update a draft
export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)

  if (!body?.entity_type || !body?.entity_id) {
    return jsonError('entity_type and entity_id are required', 400)
  }

  const { data: { user } } = await supabase.auth.getUser()

  const payload = {
    entity_type: body.entity_type,
    entity_id: body.entity_id,
    draft_data: body.draft_data || {},
    created_by: user?.id,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('drafts')
    .upsert(payload, { onConflict: 'entity_type,entity_id' })
    .select('*')
    .single()

  if (error) return jsonError(`Failed to save draft: ${error.message}`, 500)

  return jsonOk(data)
}

// DELETE a draft
export async function DELETE(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { searchParams } = new URL(request.url)
  const entityType = searchParams.get('entity_type')
  const entityId = searchParams.get('entity_id')

  if (!entityType || !entityId) {
    return jsonError('entity_type and entity_id are required', 400)
  }

  const { error } = await supabase
    .from('drafts')
    .delete()
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)

  if (error) return jsonError(`Failed to delete draft: ${error.message}`, 500)

  return jsonOk({ success: true, message: 'Draft deleted successfully' })
}