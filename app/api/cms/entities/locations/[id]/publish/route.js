import {
  requireAdminContext,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  revalidateCmsPaths,
} from '../../../../_utils'
import { checkDraftForBrokenLinks } from '../../../../../../../lib/publishGuard'
import { getCanonicalPath } from '../../../../../../../lib/cmsPublishing'

export const dynamic = 'force-dynamic'

// Same contract as app/api/cms/pages/[id]/publish/route.js, for locations: gated by the
// broken-link check first (zero writes on a blocked publish), then the atomic
// publish_location_draft() Postgres function merges the shadow draft onto its live row (or, for
// a never-before-published location, just flips it live).
export async function POST(request, { params }) {
  try {
    const { response: unauthorized } = await requireAdminContext(request, { resource: 'locations', action: 'publish' })
    if (unauthorized) return unauthorized

    const { id } = await params
    if (!id) return jsonError('Record id is required.', 400)

    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response

    const { data: draft, error: draftError } = await supabase.from('locations').select('*').eq('id', id).maybeSingle()
    if (draftError) return jsonError(`Failed to load location: ${draftError.message}`, 500)
    if (!draft) return jsonError('Location not found.', 404)

    const { data: sections, error: sectionsError } = await supabase
      .from('location_sections')
      .select('*')
      .eq('location_id', id)
      .order('order_index', { ascending: true })
    if (sectionsError) return jsonError(`Failed to load sections: ${sectionsError.message}`, 500)

    const guard = await checkDraftForBrokenLinks(supabase, { record: draft, sections: sections || [] })
    if (guard.blocked) {
      return jsonError(`Cannot publish: ${guard.broken.length} broken link(s) found.`, 409, { broken: guard.broken })
    }

    const { data: live, error: publishError } = await supabase.rpc('publish_location_draft', { p_draft_id: id })
    if (publishError) return jsonError(`Failed to publish location: ${publishError.message}`, 500)

    const revalidation = live?.slug
      ? revalidateCmsPaths(['/', getCanonicalPath('location', live.slug)])
      : { ok: true }
    if (!revalidation.ok) {
      return jsonError('Location published, but cache revalidation failed. Please retry.', 500, live)
    }
    return jsonOk(live)
  } catch (error) {
    return jsonError(`Internal server error: ${error.message}`, 500)
  }
}
