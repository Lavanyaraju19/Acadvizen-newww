// Walks a page_templates.parent_template_id chain and merges template_data so a child
// template can extend a parent (inheritance): the child's own sections win if it has any,
// otherwise the parent's are inherited; any other top-level template_data keys follow the
// same "child overrides parent" rule via object spread order. A `seen` set guards against a
// cycle (shouldn't be possible given the app-level check in the PATCH route below, but a
// resolver that can infinite-loop on bad data is a landmine worth removing outright).
export async function resolveTemplateChain(supabase, templateId, seen = new Set()) {
  if (!templateId || seen.has(templateId)) return { data: {}, chain: [] }
  seen.add(templateId)

  const { data: tpl, error } = await supabase.from('page_templates').select('*').eq('id', templateId).maybeSingle()
  if (error || !tpl) return { data: {}, chain: [] }

  let parentResult = { data: {}, chain: [] }
  if (tpl.parent_template_id) {
    parentResult = await resolveTemplateChain(supabase, tpl.parent_template_id, seen)
  }

  const ownData = tpl.template_data && typeof tpl.template_data === 'object' ? tpl.template_data : {}
  const mergedSections = Array.isArray(ownData.sections) && ownData.sections.length
    ? ownData.sections
    : Array.isArray(parentResult.data.sections)
      ? parentResult.data.sections
      : []

  return {
    data: { ...parentResult.data, ...ownData, sections: mergedSections },
    chain: [...parentResult.chain, { id: tpl.id, name: tpl.name }],
  }
}

export async function wouldCreateTemplateCycle(supabase, templateId, newParentId) {
  if (!newParentId) return false
  if (newParentId === templateId) return true
  let cursor = newParentId
  const seen = new Set()
  while (cursor) {
    if (cursor === templateId) return true
    if (seen.has(cursor)) return true
    seen.add(cursor)
    const { data } = await supabase.from('page_templates').select('parent_template_id').eq('id', cursor).maybeSingle()
    cursor = data?.parent_template_id || null
  }
  return false
}
