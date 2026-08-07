import {
  requireAdminContext,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  logAuditEvent,
} from '../../../_utils'

export const dynamic = 'force-dynamic'

// DELETE /api/cms/internal-links/edges/:id - "Remove" a manually declared link.
export async function DELETE(request, { params }) {
  const { context, response } = await requireAdminContext(request)
  if (response) return response

  const { supabase, response: clientResponse } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (clientResponse) return clientResponse

  const { id } = await params
  if (!id) return jsonError('id is required.', 400)

  const { data, error } = await supabase.from('internal_link_edges').delete().eq('id', id).select('id').maybeSingle()
  if (error) return jsonError(`Failed to remove link: ${error.message}`, 500)
  if (!data) return jsonError('Link not found.', 404)

  await logAuditEvent(supabase, {
    userId: context.user.id,
    action: 'internal_link_edge_delete',
    entityType: 'internal_link_edge',
    entityId: id,
    changes: {},
    request,
  })

  return jsonOk({ id })
}
