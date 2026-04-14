import { blogs as localBlogs } from '../data/blogs'

export const BLOG_SLUG_ALIASES = {
  'ai-digital-marketing-career-guide': 'ai-digital-marketing-career-2026',
  'digital-marketing-career-guide': 'career-in-digital-marketing-2026',
  'digital-marketing-career-roadmap': 'career-in-digital-marketing-2026',
  'google-ads-career-guide': 'seo-vs-paid-ads-career-growth',
  'mba-vs-digital-marketing-2026': 'mba-vs-digital-marketing-course-2026',
  'new-age-seo-in-2026': 'new-age-seo-2026-marketing-strategy',
  'next-generation-digital-marketing-ai-era': 'digital-marketing-skills-next-generation-ai-era',
}

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'for',
  'in',
  'of',
  'on',
  'the',
  'to',
  'vs',
  'with',
])

function tokenize(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !STOP_WORDS.has(token))
}

function scoreBlogSlugMatch(requestedSlug, blog) {
  const requestTokens = tokenize(requestedSlug)
  if (requestTokens.length < 2) return 0

  const slugTokens = tokenize(blog?.slug)
  const titleTokens = tokenize(blog?.title)
  const combinedTokens = Array.from(new Set([...slugTokens, ...titleTokens]))
  if (!combinedTokens.length) return 0

  const overlap = requestTokens.filter((token) => combinedTokens.includes(token))
  if (!overlap.length) return 0

  const overlapRatio = overlap.length / requestTokens.length
  const densityRatio = overlap.length / combinedTokens.length
  const exactPhraseBonus = String(blog?.title || '')
    .toLowerCase()
    .includes(requestTokens.join(' '))
    ? 0.25
    : 0

  return overlapRatio + densityRatio * 0.35 + exactPhraseBonus
}

export function canonicalizeKnownBlogSlug(slug = '') {
  if (!slug) return ''
  return BLOG_SLUG_ALIASES[String(slug).trim()] || String(slug).trim()
}

export function findLocalBlogBySlug(slug = '', availableBlogs = localBlogs) {
  const safeBlogs = Array.isArray(availableBlogs) ? availableBlogs.filter((entry) => entry && typeof entry === 'object') : []
  const resolvedSlug = resolveBlogSlug(slug, safeBlogs)
  if (!resolvedSlug) return null
  return safeBlogs.find((entry) => entry.slug === resolvedSlug) || null
}

export function resolveBlogSlug(slug = '', availableBlogs = localBlogs) {
  const safeBlogs = Array.isArray(availableBlogs) ? availableBlogs.filter((entry) => entry && typeof entry === 'object') : []
  const requestedSlug = String(slug || '').trim()
  if (!requestedSlug) return null

  const exactMatch = safeBlogs.find((entry) => entry.slug === requestedSlug)
  if (exactMatch?.slug) return exactMatch.slug

  const aliasedSlug = canonicalizeKnownBlogSlug(requestedSlug)
  if (aliasedSlug !== requestedSlug && safeBlogs.some((entry) => entry.slug === aliasedSlug)) {
    return aliasedSlug
  }

  let bestMatch = null
  let bestScore = 0

  for (const blog of safeBlogs) {
    const score = scoreBlogSlugMatch(requestedSlug, blog)
    if (score > bestScore) {
      bestScore = score
      bestMatch = blog
    }
  }

  if (bestMatch?.slug && bestScore >= 1.05) {
    return bestMatch.slug
  }

  return null
}
