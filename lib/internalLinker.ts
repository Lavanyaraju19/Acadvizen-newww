type LinkItem = {
  title: string
  slug: string
  type: 'blog' | 'course' | 'tool' | 'location'
}

type LinkSource = {
  title?: string
  tags?: string[]
}

type LinkCandidates = {
  blogs?: LinkItem[]
  courses?: LinkItem[]
  tools?: LinkItem[]
  locations?: LinkItem[]
}

const tokenize = (value?: string) =>
  (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

const scoreItem = (sourceTokens: Set<string>, item: LinkItem) => {
  const tokens = tokenize(item.title)
  return tokens.reduce((score, token) => (sourceTokens.has(token) ? score + 1 : score), 0)
}

const pickTop = (source: LinkSource, items: LinkItem[], limit = 3) => {
  const sourceTokens = new Set([...tokenize(source.title), ...(source.tags || []).map((tag) => tag.toLowerCase())])
  return items
    .map((item) => ({ item, score: scoreItem(sourceTokens, item) }))
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .filter((entry) => entry.score > 0)
    .slice(0, limit)
    .map((entry) => entry.item)
}

export function buildInternalLinks(source: LinkSource, candidates: LinkCandidates, limit = 3) {
  return {
    blogs: pickTop(source, candidates.blogs || [], limit),
    courses: pickTop(source, candidates.courses || [], limit),
    tools: pickTop(source, candidates.tools || [], limit),
    locations: pickTop(source, candidates.locations || [], limit),
  }
}
