import {
  requireAdminContext,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  logAuditEvent,
  readJsonBody,
} from '../../_utils'

export const dynamic = 'force-dynamic'

const REQUIRED_FIELDS = ['sourceType', 'sourceId', 'sourceUrl', 'targetType', 'targetId', 'targetUrl']

// POST /api/cms/internal-links/edges - "Manually Add" a declared link relationship. This never
// mutates public content; it only records that the admin has confirmed this relationship, either
// from scratch or by promoting an accepted suggestion (origin: 'accepted_suggestion').
export async function POST(request) {
  const { context, response } = await requireAdminContext(request)
  if (response) return response

  const { supabase, response: clientResponse } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (clientResponse) return clientResponse

  const body = await readJsonBody(request)
  const missing = REQUIRED_FIELDS.filter((key) => !body?.[key])
  if (missing.length) {
    return jsonError(`Missing required field(s): ${missing.join(', ')}`, 400)
  }

  const row = {
    source_type: body.sourceType,
    source_id: body.sourceId,
    source_title: body.sourceTitle || null,
    source_url: body.sourceUrl,
    target_type: body.targetType,
    target_id: body.targetId,
    target_title: body.targetTitle || null,
    target_url: body.targetUrl,
    label: body.label || null,
    origin: body.origin === 'accepted_suggestion' ? 'accepted_suggestion' : 'manual',
    created_by: context.user.id,
  }

  const { data, error } = await supabase.from('internal_link_edges').insert(row).select('*').maybeSingle()
  if (error) return jsonError(`Failed to add link: ${error.message}`, 500)

  await logAuditEvent(supabase, {
    userId: context.user.id,
    action: 'internal_link_edge_create',
    entityType: 'internal_link_edge',
    entityId: data?.id,
    changes: { source_url: row.source_url, target_url: row.target_url },
    request,
  })

  return jsonOk(data)
}
