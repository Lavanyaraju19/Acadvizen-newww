import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
  revalidateAllCmsPages,
} from '../../_utils'

export const dynamic = 'force-dynamic'

function inferWorkflowPermission(newStatus = '') {
  const normalized = String(newStatus || '').trim().toLowerCase()
  if (!normalized) return { resource: 'pages', action: 'update' }

  if (['review', 'in_review', 'pending_review', 'submitted_for_review'].includes(normalized)) {
    return { resource: 'pages', action: 'submit_review' }
  }
  if (normalized === 'approved') {
    return { resource: 'pages', action: 'approve' }
  }
  if (normalized === 'rejected') {
    return { resource: 'pages', action: 'reject' }
  }
  if (normalized === 'published') {
    return { resource: 'pages', action: 'publish' }
  }

  return { resource: 'pages', action: 'update' }
}

export async function POST(request) {
  const body = await readJsonBody(request)
  const unauthorized = await ensureAdmin(request, inferWorkflowPermission(body?.new_status))
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { entity_type, entity_id, new_status } = body

  if (!entity_type || !entity_id || !new_status) {
    return jsonError('Missing required fields: entity_type, entity_id, new_status', 400)
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Call the workflow function
  const { data, error } = await supabase.rpc('advance_workflow', {
    p_entity_type: entity_type,
    p_entity_id: entity_id,
    p_new_status: new_status,
    p_user_id: user?.id,
  })

  if (error) return jsonError(`Failed to advance workflow: ${error.message}`, 500)
  
  revalidateAllCmsPages()
  return jsonOk(data)
}
