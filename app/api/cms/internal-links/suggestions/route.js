import {
  requireAdminContext,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  logAuditEvent,
  readJsonBody,
} from '../../_utils'

export const dynamic = 'force-dynamic'

const VALID_ACTIONS = new Set(['accept', 'reject', 'ignore', 'reset'])

// PATCH /api/cms/internal-links/suggestions - records an admin decision on a suggested link.
// Deliberately does NOT touch any public content (see the migration's header comment): accepting a
// suggestion only marks it accepted so the admin can see it needs a real link added through the
// actual content editor, or promoted into a tracked relationship via POST /internal-links/edges.
export async function PATCH(request) {
  const { context, response } = await requireAdminContext(request)
  if (response) return response

  const { supabase, response: clientResponse } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (clientResponse) return clientResponse

  const body = await readJsonBody(request)
  const id = body?.id
  const action = body?.action
  if (!id || !VALID_ACTIONS.has(action)) {
    return jsonError('id and a valid action (accept, reject, ignore, reset) are required.', 400)
  }

  const status = action === 'reset' ? 'pending' : action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'ignored'
  const patch = action === 'reset'
    ? { status, decided_at: null, decided_by: null, updated_at: new Date().toISOString() }
    : { status, decided_at: new Date().toISOString(), decided_by: context.user.id, updated_at: new Date().toISOString() }

  const { data, error } = await supabase
    .from('internal_link_suggestions')
    .update(patch)
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) return jsonError(`Failed to update suggestion: ${error.message}`, 500)
  if (!data) return jsonError('Suggestion not found.', 404)

  await logAuditEvent(supabase, {
    userId: context.user.id,
    action: `internal_link_suggestion_${action}`,
    entityType: 'internal_link_suggestion',
    entityId: id,
    changes: { source_url: data.source_url, target_url: data.target_url, status },
    request,
  })

  return jsonOk(data)
}
