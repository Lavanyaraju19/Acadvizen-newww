import {
  requireAdminContext,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
} from '../../../_utils'
import { startPageDraft } from '../../../../../../lib/pageDrafts'

export const dynamic = 'force-dynamic'

// Creates (or resumes) a "shadow row" staged draft of an already-published page: a normal second
// pages row linked back to the live one via draft_of_id, sharing its slug, with its own cloned
// copy of every section. Editing this shadow through the existing Page Builder UI/APIs never
// touches the live page until POST /api/cms/pages/[id]/publish merges it back in - see
// supabase/migrations/202608130001_staged_editing_shadow_drafts.sql and lib/pageDrafts.js.
export async function POST(request, { params }) {
  try {
    const { response: unauthorized } = await requireAdminContext(request, { resource: 'pages', action: 'update' })
    if (unauthorized) return unauthorized

    const { id } = await params
    if (!id) return jsonError('Record id is required.', 400)

    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response

    const result = await startPageDraft(supabase, id)
    if (!result.ok) return result.data ? jsonError(result.error, result.status, result.data) : jsonError(result.error, result.status)
    return jsonOk(result.draft)
  } catch (error) {
    return jsonError(`Internal server error: ${error.message}`, 500)
  }
}
