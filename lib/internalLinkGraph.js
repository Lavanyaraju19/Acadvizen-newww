// Full internal-linking engine (Phase 5). Builds a live graph of every real public content node
// (from lib/cmsPublishing.js's CMS_CONTENT_TYPES - the single existing source of truth for how
// each CMS table maps to a public URL) plus every outgoing link found in that content, then
// derives incoming links, broken links, and orphan pages from the graph. Nothing here is
// persisted except admin *decisions* (supabase/migrations/202608070009_internal_linking_engine.sql)
// - the graph itself is always computed fresh from current content so it can never go stale.
//
// lib/internalLinker.ts (the pre-existing narrow scorer used by CityCoursePageRenderer) is
// untouched and still used there; this module supersedes it only for the admin Internal Links
// screen.

import { CMS_CONTENT_TYPES, normalizeCmsSlug } from './cmsPublishing.js'

// Real static (file-based) routes that aren't backed by a CMS table, so they'd otherwise be
// misreported as broken-link targets. Sourced from CMS_PUBLIC_PATHS (app/api/cms/_utils.js) plus
// every other folder actually present under app/(public) that isn't a [dynamic] segment.
const STATIC_PUBLIC_PATHS = new Set([
  '/', '/about', '/achievements', '/contact', '/courses', '/placement', '/projects',
  '/soft-skills', '/hire-from-us', '/tools', '/testimonials', '/blog', '/blog/category',
  '/blog/tag', '/blog/author', '/companies', '/internships', '/resources',
  '/privacy-policy', '/terms-of-service', '/register', '/login', '/forgot-password',
  '/admin-login', '/sitemap.xml', '/robots.txt',
  '/ai-digital-marketing-course', '/digital-marketing-course-in-bangalore',
  '/digital-marketing-course-in-jayanagar', '/digital-marketing-internship-in-bangalore',
  '/google-ads-course-in-bangalore', '/seo-course-in-bangalore',
  '/social-media-marketing-course-in-bangalore',
])

// Only content types backed by a real table with a real standalone public route are graph nodes.
// (city_course / location_course / service_location are legacy *route patterns* whose live
// instances are actually rows in `pages` with a generated slug - not separate tables - so they're
// covered via the `page` type already.)
const GRAPH_CONTENT_TYPES = Object.entries(CMS_CONTENT_TYPES)
  .filter(([, config]) => config.publicStandalone && config.table)
  .map(([contentType, config]) => ({ contentType, ...config }))

const TITLE_FIELD_CANDIDATES = ['title', 'name', 'company_name', 'city_name', 'heading', 'label']
const HREF_PATTERN = /href\s*=\s*["']([^"']+)["']/gi
const MD_LINK_PATTERN = /\]\(([^)\s]+)\)/g

function pickTitle(record) {
  for (const key of TITLE_FIELD_CANDIDATES) {
    if (record?.[key]) return String(record[key])
  }
  return record?.slug || record?.id || 'Untitled'
}

function isVisible(record, config) {
  if (record?.deleted_at) return false
  if (config.visibilityField && record?.[config.visibilityField] === false) return false
  if (config.statusField) {
    const status = String(record?.[config.statusField] || '').trim().toLowerCase()
    if (!['published', 'live', 'approved'].includes(status)) return false
  }
  return true
}

function normalizeInternalPath(rawUrl, siteOrigins) {
  const value = String(rawUrl || '').trim()
  if (!value) return null
  if (value.startsWith('/')) return value.split('#')[0].split('?')[0] || '/'
  if (value.startsWith('mailto:') || value.startsWith('tel:') || value.startsWith('javascript:')) return null
  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value)
      const isOwnOrigin = siteOrigins.some((origin) => parsed.hostname === origin)
      if (!isOwnOrigin) return null // external domain - out of scope for broken-link checking
      return parsed.pathname || '/'
    } catch {
      return null
    }
  }
  return null // relative-without-leading-slash, anchors-only, etc. - not a resolvable internal link
}

function collectStrings(value, depth = 0) {
  if (value == null || depth > 6) return []
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap((entry) => collectStrings(entry, depth + 1))
  if (typeof value === 'object') return Object.values(value).flatMap((entry) => collectStrings(entry, depth + 1))
  return []
}

// Deliberately schema-agnostic: rather than hardcoding each table's exact rich-text column names
// (which drift - see the blogs.created_by / undocumented-column bugs found earlier this session),
// scan every string reachable from the record for href="..." markup and markdown-style links, plus
// any *_url-named field holding a relative path. This trades a little extra scan time for never
// silently missing a link because a column got renamed.
function extractOutgoingPaths(record, siteOrigins) {
  const found = new Set()

  for (const [key, value] of Object.entries(record || {})) {
    if (typeof value === 'string' && /_url$|^url$|^link$/i.test(key)) {
      const path = normalizeInternalPath(value, siteOrigins)
      if (path) found.add(path)
    }
  }

  const haystack = collectStrings(record).join('\n')
  for (const pattern of [HREF_PATTERN, MD_LINK_PATTERN]) {
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(haystack))) {
      const path = normalizeInternalPath(match[1], siteOrigins)
      if (path) found.add(path)
    }
  }

  return Array.from(found)
}

function tokenize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2)
}

/**
 * Fetches every linkable content row, builds the node index (url -> node), and returns enough raw
 * data for the caller to also compute relationship-based suggestions.
 */
export async function loadLinkGraphSource(supabase) {
  const nodesByUrl = new Map()
  const nodesByTypeId = new Map()
  const rawByType = {}

  for (const config of GRAPH_CONTENT_TYPES) {
    const { data, error } = await supabase.from(config.table).select('*').limit(2000)
    if (error || !Array.isArray(data)) continue
    rawByType[config.contentType] = data

    for (const record of data) {
      if (!record?.slug) continue
      const url = config.canonicalPath(record.slug)
      const node = {
        type: config.contentType,
        id: record.id,
        title: pickTitle(record),
        url,
        visible: isVisible(record, config),
        record,
      }
      nodesByUrl.set(url, node)
      nodesByTypeId.set(`${config.contentType}:${record.id}`, node)
    }
  }

  return { nodesByUrl, nodesByTypeId, rawByType }
}

function siteOriginsFromEnv() {
  const origins = new Set(['acadvizen.com', 'www.acadvizen.com'])
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  try {
    if (appUrl) origins.add(new URL(appUrl).hostname)
  } catch {
    // ignore malformed env value
  }
  return Array.from(origins)
}

/**
 * Computes the full graph: outgoing edges (with resolved/broken/unpublished/external status),
 * incoming index, and orphan pages. Pure function over already-fetched data so it's cheap to unit
 * test and re-run.
 */
export function computeLinkGraph({ nodesByUrl }) {
  const siteOrigins = siteOriginsFromEnv()
  const outgoing = []

  for (const source of nodesByUrl.values()) {
    const paths = extractOutgoingPaths(source.record, siteOrigins)
    for (const path of paths) {
      if (path === source.url) continue // self-links aren't useful signal either way
      const target = nodesByUrl.get(path) || (STATIC_PUBLIC_PATHS.has(path) ? { type: 'static', id: path, title: path, url: path, visible: true } : null)
      outgoing.push({
        sourceType: source.type,
        sourceId: source.id,
        sourceTitle: source.title,
        sourceUrl: source.url,
        targetUrl: path,
        targetType: target?.type || null,
        targetId: target?.id || null,
        targetTitle: target?.title || null,
        status: !target ? 'broken' : target.visible === false ? 'unpublished' : 'ok',
      })
    }
  }

  const incomingByUrl = new Map()
  for (const edge of outgoing) {
    if (edge.status === 'broken') continue
    if (!incomingByUrl.has(edge.targetUrl)) incomingByUrl.set(edge.targetUrl, [])
    incomingByUrl.get(edge.targetUrl).push(edge)
  }

  const orphans = []
  for (const node of nodesByUrl.values()) {
    if (!node.visible) continue
    if (node.url === '/') continue
    const incoming = incomingByUrl.get(node.url) || []
    if (incoming.length === 0) orphans.push(node)
  }

  const incoming = Array.from(incomingByUrl.entries()).map(([targetUrl, edges]) => ({
    targetUrl,
    targetType: edges[0]?.targetType,
    targetId: edges[0]?.targetId,
    targetTitle: edges[0]?.targetTitle,
    incomingCount: edges.length,
    sources: edges.map((edge) => ({
      sourceType: edge.sourceType,
      sourceId: edge.sourceId,
      sourceTitle: edge.sourceTitle,
      sourceUrl: edge.sourceUrl,
    })),
  }))

  return {
    outgoing,
    incoming,
    broken: outgoing.filter((edge) => edge.status === 'broken'),
    orphans: orphans.map((node) => ({ type: node.type, id: node.id, title: node.title, url: node.url })),
  }
}

/**
 * Relationship-driven suggestion engine. Only covers content types where we have a verified,
 * typed relationship to reason about (course<->location via course_locations, course<->category,
 * location<->city, blog<->blog via shared tags) plus a generic topical title-overlap fallback
 * across all nodes - deliberately not claiming relationships (e.g. "same tags") for tables whose
 * exact tag columns weren't verified against the live schema.
 */
export function generateSuggestions({ nodesByUrl, rawByType }, { limitPerSource = 5 } = {}) {
  const suggestions = []
  const seenPairs = new Set()

  function addSuggestion(source, target, reason, score) {
    if (!source || !target || source.url === target.url) return
    const key = `${source.type}:${source.id}>${target.type}:${target.id}`
    if (seenPairs.has(key)) return
    seenPairs.add(key)
    suggestions.push({
      sourceType: source.type,
      sourceId: source.id,
      sourceTitle: source.title,
      sourceUrl: source.url,
      targetType: target.type,
      targetId: target.id,
      targetTitle: target.title,
      targetUrl: target.url,
      reason,
      score,
    })
  }

  const courses = rawByType.course || []
  const locations = rawByType.location || []
  const courseNodeById = new Map(courses.map((c) => [c.id, nodesByUrl.get(CMS_CONTENT_TYPES.course.canonicalPath(c.slug))]))
  const locationNodeById = new Map(locations.map((l) => [l.id, nodesByUrl.get(CMS_CONTENT_TYPES.location.canonicalPath(l.slug))]))

  // same category
  const byCategory = new Map()
  for (const course of courses) {
    if (!course.category_id) continue
    if (!byCategory.has(course.category_id)) byCategory.set(course.category_id, [])
    byCategory.get(course.category_id).push(course)
  }
  for (const group of byCategory.values()) {
    for (const a of group) {
      for (const b of group) {
        if (a.id === b.id) continue
        addSuggestion(courseNodeById.get(a.id), courseNodeById.get(b.id), 'same_category', 3)
      }
    }
  }

  // same city (via locations.city_id)
  const byCity = new Map()
  for (const loc of locations) {
    if (!loc.city_id) continue
    if (!byCity.has(loc.city_id)) byCity.set(loc.city_id, [])
    byCity.get(loc.city_id).push(loc)
  }
  for (const group of byCity.values()) {
    for (const a of group) {
      for (const b of group) {
        if (a.id === b.id) continue
        addSuggestion(locationNodeById.get(a.id), locationNodeById.get(b.id), 'same_city', 4)
      }
    }
  }

  // shared tags (blogs)
  const blogs = rawByType.blog || []
  const blogNodeById = new Map(blogs.map((b) => [b.id, nodesByUrl.get(CMS_CONTENT_TYPES.blog.canonicalPath(b.slug))]))
  for (const a of blogs) {
    const aTags = new Set((Array.isArray(a.tags) ? a.tags : []).map((t) => String(t).toLowerCase()))
    if (!aTags.size) continue
    for (const b of blogs) {
      if (a.id === b.id) continue
      const bTags = Array.isArray(b.tags) ? b.tags : []
      const shared = bTags.filter((t) => aTags.has(String(t).toLowerCase()))
      if (shared.length) addSuggestion(blogNodeById.get(a.id), blogNodeById.get(b.id), `shared_tags:${shared.slice(0, 2).join(',')}`, Math.min(shared.length, 3))
    }
  }

  // parent/child pages
  const pages = rawByType.page || []
  const pageNodeById = new Map(pages.map((p) => [p.id, nodesByUrl.get(CMS_CONTENT_TYPES.page.canonicalPath(p.slug))]))
  for (const page of pages) {
    if (!page.parent_id) continue
    addSuggestion(pageNodeById.get(page.id), pageNodeById.get(page.parent_id), 'parent_page', 3)
    addSuggestion(pageNodeById.get(page.parent_id), pageNodeById.get(page.id), 'child_page', 3)
  }

  // topical overlap fallback across every node type (mirrors lib/internalLinker.ts's approach,
  // generalized to the full graph instead of one renderer)
  const allNodes = Array.from(nodesByUrl.values()).filter((n) => n.visible)
  const tokenSets = new Map(allNodes.map((n) => [n.url, new Set(tokenize(n.title))]))
  for (const source of allNodes) {
    const sourceTokens = tokenSets.get(source.url)
    if (!sourceTokens.size) continue
    for (const target of allNodes) {
      if (source.url === target.url) continue
      const targetTokens = tokenSets.get(target.url)
      let overlap = 0
      for (const token of targetTokens) if (sourceTokens.has(token)) overlap += 1
      if (overlap >= 2) addSuggestion(source, target, 'related_topic', overlap)
    }
  }

  // cap per source, highest score first, drop zero/negative
  const bySource = new Map()
  for (const suggestion of suggestions) {
    const key = `${suggestion.sourceType}:${suggestion.sourceId}`
    if (!bySource.has(key)) bySource.set(key, [])
    bySource.get(key).push(suggestion)
  }
  const capped = []
  for (const list of bySource.values()) {
    list.sort((a, b) => b.score - a.score)
    capped.push(...list.slice(0, limitPerSource))
  }
  return capped
}

export function getGraphContentTypes() {
  return GRAPH_CONTENT_TYPES.map((c) => c.contentType)
}
