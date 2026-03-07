export function assetUrl(path = '') {
  if (!path) return ''
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path
  const clean = String(path).startsWith('/') ? String(path).slice(1) : String(path)
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '/'
  const normalized = base.endsWith('/') ? base : `${base}/`
  return `${normalized}${clean}`
}
