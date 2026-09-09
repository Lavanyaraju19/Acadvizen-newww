import {
  requireAdminContext,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  revalidateCmsMutation,
} from '../../../_utils'
import { checkDraftForBrokenLinks } from '../../../../../../lib/publishGuard'
import { getCanonicalPublicUrl } from '../../../../../../lib/cmsPublishing'

export const dynamic = 'force-dynamic'

// Publishes a page - either a never-before-published row (draft_of_id is null: just flips it
// live) or a shadow draft of an already-published page (draft_of_id set: merges it onto the live
// row it shadows). Both cases run through the same atomic publish_page_draft() Postgres function
// (supabase/migrations/202608130001_staged_editing_shadow_drafts.sql) so the merge can never
// partially apply - and both cases are gated by the broken-link check below FIRST, so a blocked
// publish makes zero database writes.
export async function POST(request, { params }) {
  try {
    const { response: unauthorized } = await requireAdminContext(request, { resource: 'pages', action: 'publish' })
    if (unauthorized) return unauthorized

    const { id } = await params
    if (!id) return jsonError('Record id is required.', 400)

    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response

    const { data: draft, error: draftError } = await supabase.from('pages').select('*').eq('id', id).maybeSingle()
    if (draftError) return jsonError(`Failed to load page: ${draftError.message}`, 500)
    if (!draft) return jsonError('Page not found.', 404)

    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('*')
      .eq('page_id', id)
      .order('order_index', { ascending: true })
    if (sectionsError) return jsonError(`Failed to load sections: ${sectionsError.message}`, 500)

    const guard = await checkDraftForBrokenLinks(supabase, { record: draft, sections: sections || [] })
    if (guard.blocked) {
      return jsonError(`Cannot publish: ${guard.broken.length} broken link(s) found.`, 409, { broken: guard.broken })
    }

    const { data: live, error: publishError } = await supabase.rpc('publish_page_draft', { p_draft_id: id })
    if (publishError) return jsonError(`Failed to publish page: ${publishError.message}`, 500)

    const revalidation = revalidateCmsMutation('page', { slug: live?.slug })
    const responseData = live?.slug ? { ...live, canonical_public_url: getCanonicalPublicUrl('page', live.slug) } : live
    if (!revalidation.ok) {
      return jsonError('Page published, but cache revalidation failed. Please retry.', 500, responseData)
    }
    return jsonOk(responseData)
  } catch (error) {
    return jsonError(`Internal server error: ${error.message}`, 500)
  }
}
