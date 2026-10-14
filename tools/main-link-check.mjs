#!/usr/bin/env node
/**
 * Internal link check of the Main Website (read-only: GET requests only, one at a time). Reads every
 * sitemap page, collects its links to the same website, and requests each distinct target once.
 *
 *   node tools/main-link-check.mjs --main https://www.acadvizen.com --out links.json
 *
 * A target is broken when it answers 4xx/5xx or cannot be reached; redirects are listed (not broken).
 * Exit code 1 when any target is broken. Run it before and after a migration batch.
 */
import fs from 'node:fs'

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]] : acc), []))
const MAIN = String(args.main || 'https://www.acadvizen.com').replace(/\/$/, '')
const OUT = String(args.out || 'main-link-check.json')
const headers = { 'user-agent': 'acadvizen-link-check (read-only)' }

/** Same-website paths linked from a page (no files, anchors, mail or phone links). */
export function internalLinks(html, base, keepSlash = false) {
  const host = new URL(base).host
  const out = new Set()
  for (const m of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)) {
    const href = m[1].replace(/&amp;/g, '&')
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) continue
    let url
    try { url = new URL(href, base) } catch { continue }
    if (url.host !== host || !/^https?:$/.test(url.protocol)) continue
    if (/\.(pdf|jpe?g|png|webp|gif|svg|mp4|zip|xml|txt)$/i.test(url.pathname)) continue
    out.add((keepSlash ? url.pathname : url.pathname.replace(/\/$/, '') || '/') + url.search)
  }
  return [...out]
}

async function get(url) {
  try {
    const r = await fetch(url, { redirect: 'manual', headers, signal: AbortSignal.timeout(60000) })
    return { status: r.status, location: r.headers.get('location') || '' }
  } catch {
    return { status: 0, location: '' }
  }
}

async function main() {
  let pages = []
  if (args.wordpress) {
    // A WordPress site (e.g. Enrollment, whose sitemap is not served): its published pages and posts.
    for (const type of ['pages', 'posts']) {
      for (let n = 1; n < 50; n++) {
        const r = await fetch(`${MAIN}/wp-json/wp/v2/${type}?per_page=100&page=${n}&_fields=link`, { headers, signal: AbortSignal.timeout(60000) })
        if (!r.ok) break
        const rows = await r.json()
        pages.push(...rows.map((x) => new URL(x.link).pathname)) // WordPress addresses keep their trailing slash
        if (rows.length < 100) break
      }
    }
    pages = [...new Set(pages)]
  } else {
    let xml = ''
    for (let attempt = 1; !xml; attempt++) {
      try {
        xml = await (await fetch(`${MAIN}/sitemap.xml`, { headers, signal: AbortSignal.timeout(60000) })).text()
      } catch (e) {
        if (attempt >= 3) throw e // a connection reset now and then; give up after three tries
      }
    }
    pages = [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname.replace(/\/$/, '') || '/'))]
  }
  const linkedFrom = new Map()
  for (const page of pages) {
    let html = ''
    try { html = await (await fetch(`${MAIN}${page}`, { headers, signal: AbortSignal.timeout(60000) })).text() } catch { /* counted by the inventory */ }
    for (const target of internalLinks(html, `${MAIN}${page}`, Boolean(args.wordpress))) {
      if (!linkedFrom.has(target)) linkedFrom.set(target, [])
      linkedFrom.get(target).push(page)
    }
  }
  const targets = []
  for (const [target, from] of linkedFrom) targets.push({ target, ...(await get(`${MAIN}${target}`)), linked_from: from.length, examples: from.slice(0, 3) })
  const broken = targets.filter((t) => t.status === 0 || t.status >= 400)
  const redirects = targets.filter((t) => t.status >= 300 && t.status < 400)
  fs.writeFileSync(OUT, JSON.stringify({ read_at: new Date().toISOString(), main: MAIN, method: 'GET only, sequential, read-only', pages: pages.length, targets: targets.length, broken: broken.length, redirects: redirects.length, rows: targets }, null, 1))
  console.log(`${pages.length} pages, ${targets.length} distinct internal link targets: ${broken.length} broken, ${redirects.length} redirects`)
  for (const t of broken) console.log(`  BROKEN ${t.status} ${t.target} (from ${t.linked_from} page(s), e.g. ${t.examples[0]})`)
  process.exitCode = broken.length ? 1 : 0
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('tools/main-link-check.mjs')) await main()
