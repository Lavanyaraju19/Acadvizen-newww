import { checkDraftForBrokenLinks } from './publishGuard'

// Staged editing of pages (supabase/migrations/202608130001_staged_editing_shadow_drafts.sql),
// shared by Main's /admin routes and the WordPress central admin, so both use one publish path.

/**
 * Creates (or resumes) the "shadow row" draft of an already-published page: a second pages row
 * linked to the live one via draft_of_id, sharing its slug, with a cloned copy of every section.
 * @returns {Promise<{ ok: true, draft: object } | { ok: false, status: number, error: string, data?: object }>}
 */
export async function startPageDraft(supabase, id) {
  const { data: live, error: liveError } = await supabase.from('pages').select('*').eq('id', id).maybeSingle()
  if (liveError) return { ok: false, status: 500, error: `Failed to load page: ${liveError.message}` }
  if (!live) return { ok: false, status: 404, error: 'Page not found.' }
  if (live.draft_of_id) {
    return { ok: false, status: 400, error: 'This page is itself a draft. Start a draft from the live page it belongs to instead.' }
  }

  // Idempotent "resume editing" - never create a second shadow for the same live page.
  const { data: existingDraft, error: existingDraftError } = await supabase.from('pages').select('*').eq('draft_of_id', id).maybeSingle()
  if (existingDraftError) return { ok: false, status: 500, error: `Failed to check for an existing draft: ${existingDraftError.message}` }
  if (existingDraft) return { ok: true, draft: existingDraft }

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
  if (insertError) return { ok: false, status: 500, error: `Failed to start draft: ${insertError.message}` }

  const { data: sourceSections, error: sectionsError } = await supabase
    .from('sections')
    .select('*')
    .eq('page_id', id)
    .order('order_index', { ascending: true })
  if (sectionsError) return { ok: false, status: 500, error: `Draft created, but loading sections to clone failed: ${sectionsError.message}`, data: shadow }

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
    if (cloneError) return { ok: false, status: 500, error: `Draft created, but cloning sections failed: ${cloneError.message}`, data: shadow }
  }

  return { ok: true, draft: shadow }
}

/**
 * Publishes a page - a never-before-published row (draft_of_id null: flipped live) or a shadow draft
 * (merged onto its live row) - through the atomic publish_page_draft() function, after the
 * broken-link check. A blocked publish makes zero database writes.
 * @returns {Promise<{ ok: true, live: object } | { ok: false, status: number, error: string, broken?: array }>}
 */
export async function publishPage(supabase, id) {
  const { data: draft, error: draftError } = await supabase.from('pages').select('*').eq('id', id).maybeSingle()
  if (draftError) return { ok: false, status: 500, error: `Failed to load page: ${draftError.message}` }
  if (!draft) return { ok: false, status: 404, error: 'Page not found.' }

  const { data: sections, error: sectionsError } = await supabase.from('sections').select('*').eq('page_id', id).order('order_index', { ascending: true })
  if (sectionsError) return { ok: false, status: 500, error: `Failed to load sections: ${sectionsError.message}` }

  const guard = await checkDraftForBrokenLinks(supabase, { record: draft, sections: sections || [] })
  if (guard.blocked) return { ok: false, status: 409, error: `Cannot publish: ${guard.broken.length} broken link(s) found.`, broken: guard.broken }

  const { data: live, error: publishError } = await supabase.rpc('publish_page_draft', { p_draft_id: id })
  if (publishError) return { ok: false, status: 500, error: `Failed to publish page: ${publishError.message}` }
  return { ok: true, live }
}
