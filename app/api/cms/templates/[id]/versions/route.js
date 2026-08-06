import { requireAdminContext, getSupabaseClientOrResponse, jsonError, jsonOk } from '../../../_utils'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  const { response } = await requireAdminContext(request, { resource: 'templates', action: 'read' })
  if (response) return response

  const { supabase, response: clientResponse } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (clientResponse) return clientResponse

  const { id } = await params
  const { data, error } = await supabase
    .from('page_template_versions')
    .select('id, version_number, name, description, created_at, created_by')
    .eq('template_id', id)
    .order('version_number', { ascending: false })

  if (error) return jsonError(`Failed to load version history: ${error.message}`, 500, [])
  return jsonOk(data || [])
}
