function sanitizeJson(value, fallback = {}) {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return fallback
  }
}

function normalizeSectionPayloads(pageId, sections = []) {
  return (Array.isArray(sections) ? sections : [])
    .filter((section) => section?.type)
    .map((section, index) => ({
      page_id: pageId,
      type: String(section.type).trim(),
      order_index: Number(section.order_index ?? index) || 0,
      content_json: sanitizeJson(section.content_json, {}),
      style_json: sanitizeJson(section.style_json, {}),
      visibility: section.visibility !== false,
    }))
}

function logImportStep(step, payload = {}) {
  console.info('[cms-import]', step, payload)
}

function logImportError(step, error, payload = {}) {
  console.error('[cms-import]', step, {
    message: error?.message || String(error),
    code: error?.code || null,
    details: error?.details || null,
    hint: error?.hint || null,
    ...payload,
  })
}

async function upsertPageBySlug(supabase, template) {
  const payload = {
    title: String(template.title || '').trim(),
    slug: String(template.slug || '').trim(),
    description: template.description || null,
    seo_title: template.seo_title || null,
    seo_description: template.seo_description || null,
    status: template.status === 'published' ? 'published' : 'draft',
  }

  if (!payload.title || !payload.slug) {
    throw new Error(`Invalid page payload for "${template.slug || 'unknown'}": title and slug are required.`)
  }

  const { data: existingPages, error: existingError } = await supabase
    .from('pages')
    .select('id, slug')
    .eq('slug', payload.slug)

  if (existingError) {
    logImportError('lookup-page', existingError, { slug: payload.slug })
    throw new Error(`Failed to check existing page "${payload.slug}": ${existingError.message}`)
  }

  if ((existingPages || []).length > 1) {
    throw new Error(`Duplicate CMS pages found for slug "${payload.slug}".`)
  }

  if (existingPages?.[0]?.id) {
    const { data, error } = await supabase
      .from('pages')
      .update(payload)
      .eq('id', existingPages[0].id)
      .select('*')
      .single()

    if (error) {
      logImportError('update-page', error, { slug: payload.slug, pageId: existingPages[0].id })
      throw new Error(`Failed to update page "${payload.slug}": ${error.message}`)
    }

    return data
  }

  const { data, error } = await supabase
    .from('pages')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    logImportError('insert-page', error, { slug: payload.slug })
    throw new Error(`Failed to create page "${payload.slug}": ${error.message}`)
  }

  return data
}

export async function importCmsTemplates(supabase, templates = [], { replaceSections = true } = {}) {
  const summary = []

  for (const template of templates) {
    logImportStep('sync-page:start', { slug: template?.slug || null })
    const page = await upsertPageBySlug(supabase, template)

    if (replaceSections) {
      const { error: deleteError } = await supabase.from('sections').delete().eq('page_id', page.id)
      if (deleteError) {
        logImportError('delete-sections', deleteError, { slug: template.slug, pageId: page.id })
        throw new Error(`Failed to reset sections for "${template.slug}": ${deleteError.message}`)
      }
    }

    const sectionPayloads = normalizeSectionPayloads(page.id, template.sections)

    if (sectionPayloads.length) {
      const { error: insertError } = await supabase.from('sections').insert(sectionPayloads)
      if (insertError) {
        logImportError('insert-sections', insertError, {
          slug: template.slug,
          pageId: page.id,
          sections: sectionPayloads.length,
        })
        throw new Error(`Failed to import sections for "${template.slug}": ${insertError.message}`)
      }
    }

    summary.push({
      slug: template.slug,
      title: template.title,
      page_id: page.id,
      sections: sectionPayloads.length,
      status: page.status,
    })
    logImportStep('sync-page:done', { slug: template.slug, pageId: page.id, sections: sectionPayloads.length })
  }

  return summary
}
