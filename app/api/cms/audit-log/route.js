import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  parsePositiveInt,
} from '../_utils'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const unauthorized = await ensureAdmin(request, { resource: 'analytics', action: 'read' })
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { searchParams } = new URL(request.url)
  const entityType = searchParams.get('entity_type')
  const action = searchParams.get('action')
  const limit = parsePositiveInt(searchParams.get('limit'), 200)

  let query = supabase
    .from('audit_log')
    .select('id, user_id, action, entity_type, entity_id, changes, ip_address, created_at')
    .order('created_at', { ascending: false })
    .limit(limit || 200)

  if (entityType) query = query.eq('entity_type', entityType)
  if (action) query = query.eq('action', action)

  const { data, error } = await query
  if (error) return jsonError(`Failed to load audit log: ${error.message}`, 500, [])

  const rows = Array.isArray(data) ? data : []
  const userIds = Array.from(new Set(rows.map((row) => row.user_id).filter(Boolean)))
  let profilesById = {}
  if (userIds.length) {
    const { data: profiles } = await supabase.from('profiles').select('id, email, full_name').in('id', userIds)
    profilesById = Object.fromEntries((profiles || []).map((profile) => [profile.id, profile]))
  }

  const enriched = rows.map((row) => ({
    ...row,
    actor_email: profilesById[row.user_id]?.email || null,
    actor_name: profilesById[row.user_id]?.full_name || null,
  }))

  return jsonOk(enriched)
}
