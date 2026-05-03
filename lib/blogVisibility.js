export function isAutomatedTestBlog(entry = {}) {
  const title = String(entry?.title || '').trim()
  const slug = String(entry?.slug || '').trim().toLowerCase()
  const excerpt = String(entry?.description || entry?.excerpt || '').trim().toLowerCase()

  if (/^local e2e admin blog test\b/i.test(title)) return true
  if (/^local-\d{8,}$/i.test(slug) && excerpt.includes('local runtime testing')) return true
  return false
}

export function isPublicBlogVisible(entry = {}) {
  return !isAutomatedTestBlog(entry)
}
