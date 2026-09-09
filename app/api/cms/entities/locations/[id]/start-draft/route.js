import {
  requireAdminContext,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
} from '../../../../_utils'

export const dynamic = 'force-dynamic'

// Same "shadow row" staged-draft pattern as app/api/cms/pages/[id]/start-draft/route.js, for
// locations/location_sections. See supabase/migrations/202608130001_staged_editing_shadow_drafts.sql.
export async function POST(request, { params }) {
  try {
    const { response: unauthorized } = await requireAdminContext(request, { resource: 'locations', action: 'update' })
    if (unauthorized) return unauthorized

    const { id } = await params
    if (!id) return jsonError('Record id is required.', 400)

    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response

    const { data: live, error: liveError } = await supabase.from('locations').select('*').eq('id', id).maybeSingle()
    if (liveError) return jsonError(`Failed to load location: ${liveError.message}`, 500)
    if (!live) return jsonError('Location not found.', 404)
    if (live.draft_of_id) {
      return jsonError('This location is itself a draft. Start a draft from the live location it belongs to instead.', 400)
    }

    const { data: existingDraft, error: existingDraftError } = await supabase
      .from('locations')
      .select('*')
      .eq('draft_of_id', id)
      .maybeSingle()
    if (existingDraftError) return jsonError(`Failed to check for an existing draft: ${existingDraftError.message}`, 500)
    if (existingDraft) return jsonOk(existingDraft)

    const { id: _liveId, created_at: _createdAt, updated_at: _updatedAt, ...rest } = live
    const shadowPayload = {
      ...rest,
      draft_of_id: id,
      // Forced regardless of the live row's own state - is_active is what public RLS actually
      // gates on, so the shadow must never itself become independently publicly reachable.
      is_active: false,
    }

    const { data: shadow, error: insertError } = await supabase.from('locations').insert(shadowPayload).select('*').single()
    if (insertError) return jsonError(`Failed to start draft: ${insertError.message}`, 500)

    const { data: sourceSections, error: sectionsError } = await supabase
      .from('location_sections')
      .select('*')
      .eq('location_id', id)
      .order('order_index', { ascending: true })
    if (sectionsError) return jsonError(`Draft created, but loading sections to clone failed: ${sectionsError.message}`, 500, shadow)

    if (sourceSections?.length) {
      const clonedSections = sourceSections.map((section) => ({
        location_id: shadow.id,
        type: section.type,
        order_index: section.order_index,
        position: section.position || 'end',
        content_json: section.content_json || {},
        style_json: section.style_json || {},
        visibility: section.visibility !== false,
      }))
      const { error: cloneError } = await supabase.from('location_sections').insert(clonedSections)
      if (cloneError) return jsonError(`Draft created, but cloning sections failed: ${cloneError.message}`, 500, shadow)
    }

    return jsonOk(shadow)
  } catch (error) {
    return jsonError(`Internal server error: ${error.message}`, 500)
  }
}
