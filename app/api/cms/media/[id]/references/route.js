import { ensureAdmin, getSupabaseClientOrResponse, jsonError, jsonOk } from '../../../_utils'
import { findMediaReferences } from '../../../../../../lib/mediaReferenceScanner'

export const dynamic = 'force-dynamic'

// Reference-graph endpoint: "everywhere this media item is used" for the admin UI,
// reusing the same scanner the delete-guard uses so the two never drift apart.
export async function GET(request, { params }) {
  const unauthorized = await ensureAdmin(request, { resource: 'media', action: 'read' })
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('Media id is required.', 400)

  const { data: existing, error } = await supabase.from('media').select('url').eq('id', id).maybeSingle()
  if (error) return jsonError(`Failed to load media item: ${error.message}`, 500)
  if (!existing) return jsonError('Media item not found.', 404)

  const references = await findMediaReferences(supabase, existing.url)
  return jsonOk({ references, total: references.reduce((sum, r) => sum + r.count, 0) })
}
