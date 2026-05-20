import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  parsePositiveInt,
} from '../_utils'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { searchParams } = new URL(request.url)
  const query = String(searchParams.get('q') || '').trim()
  const role = String(searchParams.get('role') || '').trim()
  const approvalStatus = String(searchParams.get('approval_status') || '').trim()
  const limit = parsePositiveInt(searchParams.get('limit'), 500)

  let dbQuery = supabase
    .from('profiles')
    .select('id,email,full_name,role,approval_status,student_id,created_at,updated_at')
    .order('created_at', { ascending: false })
    .limit(limit || 500)

  if (role && role !== 'all') dbQuery = dbQuery.eq('role', role)
  if (approvalStatus && approvalStatus !== 'all') dbQuery = dbQuery.eq('approval_status', approvalStatus)

  if (query) {
    const escaped = query.replace(/[%_]/g, '')
    dbQuery = dbQuery.or(
      `email.ilike.%${escaped}%,full_name.ilike.%${escaped}%,student_id.ilike.%${escaped}%`
    )
  }

  const { data, error } = await dbQuery
  if (error) return jsonError(`Failed to load users: ${error.message}`, 500, [])

  return jsonOk(data || [])
}
