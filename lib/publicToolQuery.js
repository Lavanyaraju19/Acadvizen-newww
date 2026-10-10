// Only active tools, as /api/tools-extended serves them: an unpublished tool's name must not stay
// in its page title and structured data (found 10 October 2026 on an unpublished test tool).
export function publicToolBySlugQuery(query, slug) {
  return query.select('name,description,slug').eq('is_active', true).eq('slug', slug).limit(1)
}
