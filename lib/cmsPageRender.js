/**
 * A CMS page without visible sections is drawn as one rich-text block from its title and
 * description (shared by the public /[slug] route and the WordPress preview, so both match).
 */
export function ensureRenderableSections(page) {
  if (!page) return page
  if (Array.isArray(page.sections) && page.sections.some((section) => section?.visibility !== false)) return page
  const text = page.description || page.seo_description || page.title
  if (!text) return page
  return {
    ...page,
    sections: [
      {
        id: `fallback-${page.id || page.slug}`,
        page_id: page.id,
        type: 'custom_rich_text',
        order_index: 0,
        visibility: true,
        content_json: {
          heading: page.title,
          text,
        },
        style_json: {},
      },
    ],
  }
}
