// Address changes made in a page's private draft copy take effect when the copy is published, not
// while it is edited: only then does the old address redirect (301) to the new one and hand over its
// SEO settings. Used by lib/pageDrafts.js; dependency-free so it can be unit-tested
// (tests/unit/draft-address-change.test.js).

/** The address the live page has before publishing `draft` ('' if unknown). */
export async function liveAddressBeforePublish(supabase, draft) {
  if (!draft) return ''
  if (!draft.draft_of_id) return draft.slug || ''
  const { data } = await supabase.from('pages').select('slug').eq('id', draft.draft_of_id).maybeSingle()
  return data?.slug || ''
}

/**
 * After publish_page_draft(): if a draft copy moved the page to a new address, redirect the old
 * address and move its SEO settings. Returns { previousSlug, warning } for revalidation and display.
 */
export async function applyPublishedAddressChange(supabase, { draft, previousSlug, live }, { createRedirect, moveSeo }) {
  const newSlug = live?.slug || ''
  if (!draft?.draft_of_id || !previousSlug || !newSlug || previousSlug === newSlug) return { previousSlug: '', warning: null }
  let warning = null
  try {
    await createRedirect(supabase, { fromPath: `/${previousSlug}`, toPath: `/${newSlug}`, statusCode: 301 })
  } catch (error) {
    warning = `Page published, but the redirect from the old address could not be created: ${error.message}`
  }
  await Promise.resolve(moveSeo(supabase, { fromSlug: previousSlug, toSlug: newSlug })).catch(() => {})
  return { previousSlug, warning }
}
