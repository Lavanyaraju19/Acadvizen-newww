import {
  requireAdminContext,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
} from '../../../_utils'

export const dynamic = 'force-dynamic'

// Creates (or resumes) a "shadow row" staged draft of an already-published page: a normal second
// pages row linked back to the live one via draft_of_id, sharing its slug, with its own cloned
// copy of every section. Editing this shadow through the existing Page Builder UI/APIs never
// touches the live page until POST /api/cms/pages/[id]/publish merges it back in - see
// supabase/migrations/202608130001_staged_editing_shadow_drafts.sql for the full design.
export async function POST(request, { params }) {
  try {
    const { response: unauthorized } = await requireAdminContext(request, { resource: 'pages', action: 'update' })
    if (unauthorized) return unauthorized

    const { id } = await params
    if (!id) return jsonError('Record id is required.', 400)

    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response

    const { data: live, error: liveError } = await supabase.from('pages').select('*').eq('id', id).maybeSingle()
    if (liveError) return jsonError(`Failed to load page: ${liveError.message}`, 500)
    if (!live) return jsonError('Page not found.', 404)
    if (live.draft_of_id) {
      return jsonError('This page is itself a draft. Start a draft from the live page it belongs to instead.', 400)
    }

    // Idempotent "resume editing" - never create a second shadow for the same live page.
    const { data: existingDraft, error: existingDraftError } = await supabase
      .from('pages')
      .select('*')
      .eq('draft_of_id', id)
      .maybeSingle()
    if (existingDraftError) return jsonError(`Failed to check for an existing draft: ${existingDraftError.message}`, 500)
    if (existingDraft) return jsonOk(existingDraft)

    const { id: _liveId, created_at: _createdAt, updated_at: _updatedAt, ...rest } = live
    const shadowPayload = {
      ...rest,
      draft_of_id: id,
      // Forced regardless of the live row's own status - these are what public RLS actually
      // gates on, so the shadow must never itself become independently publicly reachable.
      status: 'draft',
      published_at: null,
    }

    const { data: shadow, error: insertError } = await supabase.from('pages').insert(shadowPayload).select('*').single()
    if (insertError) return jsonError(`Failed to start draft: ${insertError.message}`, 500)

    const { data: sourceSections, error: sectionsError } = await supabase
      .from('sections')
      .select('*')
      .eq('page_id', id)
      .order('order_index', { ascending: true })
    if (sectionsError) return jsonError(`Draft created, but loading sections to clone failed: ${sectionsError.message}`, 500, shadow)

    if (sourceSections?.length) {
      const clonedSections = sourceSections.map((section) => ({
        page_id: shadow.id,
        type: section.type,
        order_index: section.order_index,
        content_json: section.content_json || {},
        style_json: section.style_json || {},
        visibility: section.visibility !== false,
      }))
      const { error: cloneError } = await supabase.from('sections').insert(clonedSections)
      if (cloneError) return jsonError(`Draft created, but cloning sections failed: ${cloneError.message}`, 500, shadow)
    }

    return jsonOk(shadow)
  } catch (error) {
    return jsonError(`Internal server error: ${error.message}`, 500)
  }
}
