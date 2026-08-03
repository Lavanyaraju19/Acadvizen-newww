import {
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
  requireAdminContext,
  revalidateCmsMutation,
} from '../../_utils'
import { buildCmsMutationMeta } from '../../../../../lib/cmsPublishing'

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
  const adminAccess = await requireAdminContext(request, inferWorkflowPermission(body?.new_status))
  if (adminAccess.response) return adminAccess.response

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { entity_type, entity_id, new_status } = body

  if (!entity_type || !entity_id || !new_status) {
    return jsonError('Missing required fields: entity_type, entity_id, new_status', 400)
  }

  // Call the workflow function
  const { data, error } = await supabase.rpc('advance_workflow', {
    p_entity_type: entity_type,
    p_entity_id: entity_id,
    p_new_status: new_status,
    p_user_id: adminAccess.context.user?.id,
  })

  if (error) return jsonError(`Failed to advance workflow: ${error.message}`, 500)

  const table = entity_type === 'blog' || entity_type === 'blogs' ? 'blogs' : 'pages'
  const contentType = table === 'blogs' ? 'blog' : 'page'
  const { data: record } = await supabase.from(table).select('*').eq('id', entity_id).maybeSingle()
  const revalidation = revalidateCmsMutation(contentType, { slug: record?.slug })
  return jsonOk(data, {
    publication: buildCmsMutationMeta(contentType, record || { id: entity_id, status: new_status }, revalidation),
  })
}
