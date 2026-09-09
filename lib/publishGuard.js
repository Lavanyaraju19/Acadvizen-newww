import { loadLinkGraphSource, extractOutgoingPathsForRecord, STATIC_PUBLIC_PATHS } from './internalLinkGraph'

// Publish-time broken-link gate for the staged-editing (draft -> preview -> publish) workflow.
// Reuses the exact same graph-building/link-extraction logic the site-wide "Broken Links" checker
// at /admin/internal-links already uses (lib/internalLinkGraph.js) rather than re-implementing
// link discovery - the only new piece here is checking ONE draft's own content against a fresh
// copy of that graph before a publish is allowed to proceed.

function describeSectionSource(section, index) {
  const type = section?.type ? String(section.type).replace(/_/g, ' ') : 'section'
  return `Section ${index + 1} (${type})`
}

// A link to a real-but-unpublished target 404s for a real visitor exactly like a fully broken
// one the moment they click it, so both reasons block a publish - "doesn't exist or isn't
// published" from the feature request, verbatim.
//
// Static routes (the homepage, /about, /contact, ...) are checked FIRST and unconditionally
// treated as fine: they're real Next.js routes with no backing CMS table row, always live
// regardless of database state. Without this, a stray/never-actually-used row in some CMS table
// that happens to share a static route's canonical path (confirmed live: an old unpublished
// `pages` row with slug 'home', from before the homepage moved to its own builder) would falsely
// flag the single most common link target - the homepage - as broken on every publish.
function classifyTarget(nodesByUrl, path) {
  if (STATIC_PUBLIC_PATHS.has(path)) return null
  const node = nodesByUrl.get(path)
  if (!node) return 'broken'
  if (node.visible === false) return 'unpublished'
  return null
}

export async function checkDraftForBrokenLinks(supabase, { record, sections = [] } = {}) {
  const source = await loadLinkGraphSource(supabase)
  const broken = []

  function checkOwner(owner, location) {
    if (!owner) return
    for (const path of extractOutgoingPathsForRecord(owner)) {
      const reason = classifyTarget(source.nodesByUrl, path)
      if (reason) broken.push({ location, targetUrl: path, reason })
    }
  }

  checkOwner(record, 'Page/Location fields')
  sections.forEach((section, index) => checkOwner(section, describeSectionSource(section, index)))

  return { blocked: broken.length > 0, broken }
}
