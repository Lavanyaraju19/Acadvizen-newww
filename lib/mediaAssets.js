export function normalizeAssetPath(path = '') {
  if (!path) return ''
  const value = String(path).trim()
  if (!value) return ''
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    return value
  }

  const clean = value.startsWith('/') ? value.slice(1) : value
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  return `${normalizedBase}${clean}`
}

export function buildSourceChain(...sources) {
  const flattened = sources.flat(Infinity).filter(Boolean)
  const seen = new Set()
  const chain = []

  flattened.forEach((item) => {
    const normalized = normalizeAssetPath(item)
    if (!normalized || seen.has(normalized)) return
    seen.add(normalized)
    chain.push(normalized)
  })

  return chain
}

