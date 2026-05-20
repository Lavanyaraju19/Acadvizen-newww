import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
} from '../../_utils'

export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = new Set(['admin', 'sales', 'student'])
const ALLOWED_APPROVALS = new Set(['pending', 'approved', 'rejected'])

export async function PATCH(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('User id is required.', 400)

  const body = await readJsonBody(request)
  if (!body || typeof body !== 'object') return jsonError('Invalid request body.', 400)

  const update = {}
  if ('full_name' in body) update.full_name = body.full_name || null
  if ('role' in body) {
    if (!ALLOWED_ROLES.has(String(body.role || ''))) return jsonError('Invalid role value.', 400)
    update.role = body.role
  }
  if ('approval_status' in body) {
    if (!ALLOWED_APPROVALS.has(String(body.approval_status || ''))) return jsonError('Invalid approval status.', 400)
    update.approval_status = body.approval_status
  }

  if (!Object.keys(update).length) return jsonError('No valid user fields provided.', 400)

  const { data, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', id)
    .select('id,email,full_name,role,approval_status,student_id,created_at,updated_at')
    .single()

  if (error) return jsonError(`Failed to update user: ${error.message}`, 500)
  return jsonOk(data)
}
