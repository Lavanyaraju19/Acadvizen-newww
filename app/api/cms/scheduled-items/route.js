import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
} from '../_utils'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  // Run the scheduled publishing function
  await supabase.rpc('handle_scheduled_publishing')

  // Get scheduled items
  const { data, error } = await supabase.rpc('get_scheduled_items')

  if (error) return jsonError(`Failed to fetch scheduled items: ${error.message}`, 200, [])
  return jsonOk(data || [])
}