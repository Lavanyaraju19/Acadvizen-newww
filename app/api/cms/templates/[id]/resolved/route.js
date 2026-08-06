import { requireAdminContext, getSupabaseClientOrResponse, jsonError, jsonOk } from '../../../_utils'
import { resolveTemplateChain } from '../../../../../../lib/templateResolver'

export const dynamic = 'force-dynamic'

// Returns the inheritance-merged template_data (for the Preview panel) plus the chain of
// ancestor template names, so the admin can see e.g. "Base Landing -> Course Landing" instead
// of just the child template's own (possibly empty) sections.
export async function GET(request, { params }) {
  const { response } = await requireAdminContext(request, { resource: 'templates', action: 'read' })
  if (response) return response

  const { supabase, response: clientResponse } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (clientResponse) return clientResponse

  const { id } = await params
  const resolved = await resolveTemplateChain(supabase, id)
  if (!resolved.chain.length) return jsonError('Template not found.', 404)

  return jsonOk(resolved)
}
