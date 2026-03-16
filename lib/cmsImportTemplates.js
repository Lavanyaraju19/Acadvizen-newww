export async function importCmsTemplates(supabase, templates = [], { replaceSections = true } = {}) {
  const summary = []

  for (const template of templates) {
    const pagePayload = {
      title: template.title,
      slug: template.slug,
      description: template.description || null,
      seo_title: template.seo_title || null,
      seo_description: template.seo_description || null,
      status: template.status === 'published' ? 'published' : 'draft',
    }

    const { data: page, error: pageError } = await supabase
      .from('pages')
      .upsert(pagePayload, { onConflict: 'slug' })
      .select('*')
      .single()

    if (pageError) {
      throw new Error(`Failed to import page "${template.slug}": ${pageError.message}`)
    }

    if (replaceSections) {
      const { error: deleteError } = await supabase.from('sections').delete().eq('page_id', page.id)
      if (deleteError) {
        throw new Error(`Failed to reset sections for "${template.slug}": ${deleteError.message}`)
      }
    }

    const sectionPayloads = (template.sections || []).map((section, index) => ({
      page_id: page.id,
      type: section.type,
      order_index: Number(section.order_index ?? index),
      content_json: section.content_json || {},
      style_json: section.style_json || {},
      visibility: section.visibility !== false,
    }))

    if (sectionPayloads.length) {
      const { error: insertError } = await supabase.from('sections').insert(sectionPayloads)
      if (insertError) {
        throw new Error(`Failed to import sections for "${template.slug}": ${insertError.message}`)
      }
    }

    summary.push({
      slug: template.slug,
      title: template.title,
      sections: sectionPayloads.length,
      status: pagePayload.status,
    })
  }

  return summary
}
