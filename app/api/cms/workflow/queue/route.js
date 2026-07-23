import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
} from '../../_utils'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  // Get workflow queue
  const { data, error } = await supabase.rpc('get_workflow_queue')

  if (error) return jsonError(`Failed to fetch workflow queue: ${error.message}`, 200, [])
  return jsonOk(data || [])
}