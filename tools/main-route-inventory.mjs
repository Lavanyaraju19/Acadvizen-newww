#!/usr/bin/env node
/**
 * Main Website route inventory for the WordPress/Elementor migration (read-only: GET requests only,
 * one at a time). For every sitemap address: HTTP status, title, description, canonical, robots,
 * structured data, forms, and the migration target of its route family.
 *
 *   node tools/main-route-inventory.mjs --main https://www.acadvizen.com --out inventory.json [--md checklist.md] [--text]
 *   --text also records each page's visible text lines (for tools/main-migration-compare.mjs).
 *   --main-own reads Main's own page at every address (?acv-main=1: the Render Bridge is skipped), the
 *   baseline for a migration: an address already served by WordPress is otherwise measured as WordPress.
 *
 * Migration targets follow docs/cms-implementation/MAIN-MIGRATION-PLAN.md section 2.
 */
import fs from 'node:fs'
import { MAIN_ROUTE_SEGMENTS, NEVER_REPLACEABLE_SEGMENTS, MAIN_SLUG_PREFIXES, MAIN_FALLBACK_PARAM } from '../lib/wordpress/bridgeRouting.js'

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]] : acc), []))
const MAIN = String(args.main || 'https://www.acadvizen.com').replace(/\/$/, '')
const OUT = String(args.out || 'main-route-inventory.json')
/** The address as requested: with --main-own, Main's own page (Render Bridge skipped). */
const own = (url) => (args['main-own'] ? `${url}${url.includes('?') ? '&' : '?'}${MAIN_FALLBACK_PARAM}=1` : url)

/** Route family and planned migration target for one path. */
export function classify(path) {
  const seg = path.split('/').filter(Boolean)
  const first = seg[0] || ''
  if (path === '/') return { family: 'homepage', target: 'Elementor page (Main homepage)' }
  if (NEVER_REPLACEABLE_SEGMENTS.has(first)) return { family: 'application', target: 'stays Main (never replaceable)' }
  if (first === 'blog') {
    if (seg.length === 1) return { family: 'blog list', target: 'stays Main list, or Elementor archive template' }
    if (['author', 'category', 'tag'].includes(seg[1])) return { family: 'blog taxonomy', target: 'stays Main (data-driven)' }
    return { family: 'blog post', target: 'WordPress blog post (acv_blog) + Elementor template' }
  }
  if (first === 'tools') return seg.length === 1 ? { family: 'tool list', target: 'stays Main list, or Elementor archive template' } : { family: 'tool page', target: 'WordPress tool (acv_tool) + shared Elementor design' }
  if (first === 'courses') return { family: 'course', target: 'stays Main (structured editing already live)' }
  if (['companies', 'internships', 'placement', 'resources'].includes(first)) return { family: 'data list/detail', target: 'stays Main until it has content' }
  if (seg.length === 1 && MAIN_SLUG_PREFIXES.some((p) => first.startsWith(p))) return { family: 'programmatic city page', target: 'stays Main (generated from data)' }
  if (seg.length === 1 && MAIN_ROUTE_SEGMENTS.has(first)) return { family: 'dedicated page', target: 'Elementor page (replace)' }
  if (seg.length === 1) return { family: 'Page Builder page', target: 'Elementor page or Location (shared design)' }
  return { family: 'other', target: 'review individually' }
}

const ENTITIES = { '&nbsp;': ' ', '&amp;': '&', '&#x27;': "'", '&#39;': "'", '&quot;': '"', '&lt;': '<', '&gt;': '>' }
const decode = (text) => text
  .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
  .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
  .replace(/&nbsp;|&amp;|&quot;|&lt;|&gt;/g, (m) => ENTITIES[m])

/** The page's visible text, one line per block element (scripts, styles and the head removed). */
export function visibleLines(html) {
  const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [null, html])[1]
  const text = body
    // Next.js can stream <title> into the body: it is metadata (compared on its own), not page text.
    .replace(/<(script|style|noscript|template|svg|title)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<meta\b[^>]*>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li|section|article|header|footer|nav|a|button|span|td|th|label)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
  return [...new Set(decode(text).split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).filter((line) => line.length > 3))]
}

const attr = (html, re) => decode((html.match(re) || [])[1] || '').trim()

/** What a visitor actually reads: the page's rendered text in a browser (hidden markup excluded). */
async function openBrowser() {
  const { createRequire } = await import('node:module')
  const { chromium } = createRequire(import.meta.url)('playwright')
  return chromium.launch()
}

async function renderedLines(browser, url) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 120000 })
    await page.waitForTimeout(1500)
    const text = await page.evaluate(() => {
      // Screen-reader-only text (e.g. "Skip to content", clipped to 1px until a keyboard user reaches
      // it) is not seen on screen: left out on both websites alike.
      for (const el of document.body.querySelectorAll('*')) {
        const s = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        if (s.position === 'absolute' && r.width <= 1 && r.height <= 1 && (s.clip === 'rect(0px, 0px, 0px, 0px)' || s.clipPath === 'inset(50%)' || s.overflow === 'hidden')) el.style.setProperty('display', 'none', 'important')
      }
      return document.body.innerText
    })
    return [...new Set(text.split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).filter((line) => line.length > 3))]
  } catch {
    return null // could not be read (e.g. a timeout): recorded as such, never as an empty page
  } finally {
    await page.close()
  }
}

async function main() {
  const xml = await (await fetch(`${MAIN}/sitemap.xml`, { signal: AbortSignal.timeout(60000) })).text()
  // --paths /a,/b : only these sitemap addresses (e.g. to read again those a first pass could not read).
  const only = args.paths ? String(args.paths).split(',').map((p) => p.trim()) : null
  const paths = [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname.replace(/\/$/, '') || '/'))].filter((p) => !only || only.includes(p))
  const rows = []
  // --visible: the text check uses what a visitor sees (a browser), not hidden markup in the HTML.
  const browser = args.text && args.visible ? await openBrowser() : null
  for (const path of paths) {
    let status = 0
    let html = ''
    // A dropped connection or timeout is not an answer from the site: try again (3 attempts). Any HTTP
    // answer, an error status included, is recorded as it is. 22 Oct 2026: two addresses read as 0 once
    // on a slow network ended a release's control check although both answered 200.
    // A 503 ("temporarily unavailable, try again in a minute") is asked once more after 3 s and the row says so
    // (retried_503): 26 Oct 2026, single 503s on a busy WordPress stopped three release control checks.
    let retried503 = false
    for (let attempt = 1; attempt <= 3 && (!status || (status === 503 && !retried503)); attempt++) {
      if (status === 503) { retried503 = true; await new Promise((ok) => setTimeout(ok, 3000)) }
      try {
        const r = await fetch(own(`${MAIN}${path}`), { redirect: 'manual', headers: { 'user-agent': 'acadvizen-route-inventory (read-only)' }, signal: AbortSignal.timeout(60000) })
        status = r.status
        html = status === 200 ? await r.text() : ''
      } catch {
        status = 0
        html = ''
        if (attempt < 3) await new Promise((ok) => setTimeout(ok, 5000 * attempt))
      }
    }
    rows.push({
      path,
      status,
      ...(retried503 ? { retried_503: true } : {}),
      ...classify(path),
      title: attr(html, /<title[^>]*>([^<]*)<\/title>/i),
      description: attr(html, /<meta[^>]+name="description"[^>]+content="([^"]*)"/i),
      canonical: attr(html, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i),
      robots: attr(html, /<meta[^>]+name="robots"[^>]+content="([^"]*)"/i),
      json_ld: (html.match(/application\/ld\+json/g) || []).length,
      forms: (html.match(/<form\b/gi) || []).length,
      h1: attr(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').slice(0, 120),
      ...(args.text ? await (async () => {
        const text = browser && status === 200 ? await renderedLines(browser, own(`${MAIN}${path}`)) : visibleLines(html)
        return text === null ? { text: [], text_unread: true } : { text }
      })() : {}),
    })
  }
  if (browser) await browser.close()
  const summary = {}
  for (const r of rows) {
    const key = `${r.family} → ${r.target}`
    summary[key] = (summary[key] || 0) + 1
  }
  fs.writeFileSync(OUT, JSON.stringify({ read_at: new Date().toISOString(), main: MAIN, method: 'GET only, sequential, read-only', total: rows.length, not_200: rows.filter((r) => r.status !== 200).length, summary, rows }, null, 1))
  if (args.md) {
    const lines = ['| Path | Status | Family | Migration target | Title | Canonical | JSON-LD | Forms |', '|---|---|---|---|---|---|---|---|']
    for (const r of rows) lines.push(`| \`${r.path}\` | ${r.status} | ${r.family} | ${r.target} | ${r.title.replace(/\|/g, '\\|').slice(0, 70)} | ${r.canonical ? 'yes' : '**no**'} | ${r.json_ld} | ${r.forms} |`)
    fs.writeFileSync(String(args.md), lines.join('\n') + '\n')
  }
  console.log(`${rows.length} addresses, ${rows.filter((r) => r.status !== 200).length} not 200`)
  for (const [key, n] of Object.entries(summary).sort((a, b) => b[1] - a[1])) console.log(`${String(n).padStart(4)}  ${key}`)
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('tools/main-route-inventory.mjs')) await main()
