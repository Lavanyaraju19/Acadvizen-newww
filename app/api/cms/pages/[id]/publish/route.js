import {
  requireAdminContext,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  revalidateCmsMutation,
} from '../../../_utils'
import { publishPage } from '../../../../../../lib/pageDrafts'
import { getCanonicalPublicUrl } from '../../../../../../lib/cmsPublishing'

export const dynamic = 'force-dynamic'

// Publishes a page - either a never-before-published row (draft_of_id is null: just flips it
// live) or a shadow draft of an already-published page (draft_of_id set: merges it onto the live
// row it shadows). Both cases run through the same atomic publish_page_draft() Postgres function
// (supabase/migrations/202608130001_staged_editing_shadow_drafts.sql) so the merge can never
// partially apply - and both cases are gated by the broken-link check FIRST (lib/pageDrafts.js),
// so a blocked publish makes zero database writes.
export async function POST(request, { params }) {
  try {
    const { response: unauthorized } = await requireAdminContext(request, { resource: 'pages', action: 'publish' })
    if (unauthorized) return unauthorized

    const { id } = await params
    if (!id) return jsonError('Record id is required.', 400)

    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response

    const result = await publishPage(supabase, id)
    if (!result.ok) return result.broken ? jsonError(result.error, result.status, { broken: result.broken }) : jsonError(result.error, result.status)
    const { live } = result

    const revalidation = revalidateCmsMutation('page', { slug: live?.slug, previousSlug: result.previousSlug || '' })
    const responseData = live?.slug ? { ...live, canonical_public_url: getCanonicalPublicUrl('page', live.slug) } : live
    if (!revalidation.ok) {
      return jsonError('Page published, but cache revalidation failed. Please retry.', 500, responseData)
    }
    return jsonOk(responseData, result.warning ? { warning: result.warning } : undefined)
  } catch (error) {
    return jsonError(`Internal server error: ${error.message}`, 500)
  }
}
