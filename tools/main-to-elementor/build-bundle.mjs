#!/usr/bin/env node
/**
 * Builds an Acadvizen Master Admin migration bundle from the LIVE Main Website (read-only GETs)
 * and its public Supabase content (anon key, read-only).
 *
 *   NEXT_PUBLIC_SUPABASE_URL=… NEXT_PUBLIC_SUPABASE_ANON_KEY=… \
 *   node tools/main-to-elementor/build-bundle.mjs --out bundle.json [--only tools,pages] [--limit N]
 *
 * The bundle is imported in WordPress: Acadvizen Master Admin > Import Main Website.
 * Nothing here writes to the Main Website or Supabase.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'
import { Converter, DesignSystem, elementId } from './convert.mjs'
import { keepMargins } from './elementor-json.mjs'
import { captureRoute, MAIN_SHELL } from './capture.mjs'
import * as families from './families.mjs'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]] : acc), []))
const MAIN = String(args.main || 'https://www.acadvizen.com').replace(/\/$/, '')
const OUT = String(args.out || 'acadvizen-main-bundle.json')
const ONLY = args.only ? String(args.only).split(',') : ['shell', 'tools', 'blogs', 'services', 'pages']
const LIMIT = args.limit ? Number(args.limit) : Infinity
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)

// A build makes hundreds of read-only requests over 20+ minutes; one dropped connection
// (ECONNRESET, timeout) must not end it. Network errors are retried; HTTP answers are returned as is.
const plainFetch = globalThis.fetch
globalThis.fetch = async (url, init) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await plainFetch(url, init)
    } catch (e) {
      if (attempt >= 4) throw e
      log(`network error (${e.cause?.code || e.message}), retry ${attempt} of 3: ${String(url).slice(0, 80)}`)
      await new Promise((ok) => setTimeout(ok, 2000 * attempt))
    }
  }
}

/* Bundle state ---------------------------------------------------------------------------------- */

const bundle = {
  format: 'acadvizen-main-migration',
  version: 1,
  batch: `main-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
  name: `Main Website migration ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
  source: MAIN,
  generated_at: new Date().toISOString(),
  media: [],
  terms: [],
  menus: [],
  kit: null,
  templates: [],
  settings: { design_templates: {}, main_css: '' },
  records: [],
  notes: [],
}
const mediaByUrl = new Map()

function absolute(url) {
  if (!url) return ''
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return `${MAIN}${url}`
  return url
}

/** Next.js optimised image URLs (/_next/image?url=…) point at the original file. */
function originalImageUrl(url) {
  try {
    const u = new URL(absolute(url))
    if (u.pathname === '/_next/image' && u.searchParams.get('url')) return absolute(u.searchParams.get('url'))
    return u.href
  } catch {
    return url
  }
}

function media(url, alt = '') {
  const src = originalImageUrl(url)
  if (!src || src.startsWith('data:')) return { url: src, id: '' }
  if (!mediaByUrl.has(src)) {
    const key = `m${crypto.createHash('md5').update(src).digest('hex').slice(0, 12)}`
    mediaByUrl.set(src, key)
    bundle.media.push({ key, url: src, alt, filename: decodeURIComponent(path.basename(new URL(src).pathname)) || `${key}.png` })
  }
  const key = mediaByUrl.get(src)
  return { url: `acv-media://${key}`, id: `acv-media-id://${key}` }
}

/** Links: same-site absolute links become Main Website paths. */
function link(href) {
  if (!href) return href
  try {
    const u = new URL(href, MAIN)
    if (u.host === new URL(MAIN).host) return `${u.pathname}${u.search}${u.hash}`
  } catch {}
  return href
}

/* Elementor JSON helpers ------------------------------------------------------------------------ */

function walk(elements, fn, parent = null) {
  for (const el of elements) {
    fn(el, parent)
    walk(el.elements || [], fn, el)
  }
}

const widgetText = (el) => {
  const s = el.settings || {}
  return String(s.title || s.editor || s.text || '').replace(/<[^>]+>/g, '').trim()
}

function textsOf(el) {
  const out = []
  walk([el], (x) => { if (x.elType === 'widget') out.push(widgetText(x)) })
  return out.filter(Boolean)
}

/** Replaces visible text (exact, case-sensitive) in text-bearing widgets. */
function replaceText(elements, from, to) {
  if (!from) return 0
  let n = 0
  walk(elements, (el) => {
    const s = el.settings || {}
    for (const key of ['title', 'editor', 'text']) {
      if (typeof s[key] === 'string' && s[key].includes(from)) {
        s[key] = s[key].split(from).join(to)
        n++
      }
    }
  })
  return n
}

function replaceLinks(elements, predicate, url) {
  walk(elements, (el) => {
    const s = el.settings || {}
    if (s.link && predicate(s.link.url || '')) s.link = { ...s.link, url }
    if (typeof s.editor === 'string') s.editor = s.editor.replace(/href="([^"]*)"/g, (m, h) => (predicate(h) ? `href="${url}"` : m))
  })
}

function findContainer(elements, predicate) {
  let found = null
  walk(elements, (el, parent) => { if (!found && el.elType === 'container' && predicate(el, parent)) found = { el, parent } })
  return found
}

/** The innermost container matching the predicate (a match none of whose child containers match). */
function findDeepestContainer(elements, predicate) {
  let found = null
  walk(elements, (el, parent) => { if (el.elType === 'container' && predicate(el, parent)) found = { el, parent } })
  return found
}

function replaceElement(elements, target, replacement) {
  for (let i = 0; i < elements.length; i++) {
    if (elements[i] === target) { keepMargins(target, replacement); elements.splice(i, 1, ...[].concat(replacement)); return true }
    if (replaceElement(elements[i].elements || [], target, replacement)) return true
  }
  return false
}

function shortcodeWidget(seed, shortcode, extra = {}) {
  return { id: elementId(seed), elType: 'widget', widgetType: 'shortcode', settings: { shortcode, ...extra }, elements: [], isInner: false }
}

/* Supabase (public, read-only) ------------------------------------------------------------------ */

async function supabase(table, query = 'select=*') {
  if (!SB_URL || !SB_KEY) throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are required')
  const rows = []
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, Range: `${from}-${from + 999}` } })
    const page = await r.json()
    if (!Array.isArray(page)) throw new Error(`${table}: ${JSON.stringify(page).slice(0, 200)}`)
    rows.push(...page)
    if (page.length < 1000) break
  }
  return rows
}

/* SEO ------------------------------------------------------------------------------------------- */

/** The share image (og:image) as a Media Library item, so Rank Math publishes it and an admin can change it. */
function ogImage(url) {
  if (!url) return { og_image: '', og_image_id: '' }
  const m = media(absolute(url), 'Share image')
  return { og_image: m.url, og_image_id: m.id }
}

/**
 * The Main Website shows most titles with the site name twice ("About | Acadvizen | Acadvizen",
 * fixed in app/lib/seo.js). WordPress keeps it once.
 */
const oneSiteName = (t) => (typeof t === 'string' ? t.replace(/(\s*\|\s*Acadvizen){2,}\s*$/i, ' | Acadvizen') : t)

function seoFrom(captured, path) {
  const s = captured.seo || {}
  return {
    title: oneSiteName(s.title),
    description: s.description,
    canonical: s.canonical ? absolute(s.canonical) : '',
    og_title: oneSiteName(s.og_title),
    og_description: s.og_description,
    ...ogImage(s.og_image),
    twitter_title: oneSiteName(s.twitter_title),
    twitter_description: s.twitter_description,
    noindex: /noindex/i.test(s.robots || ''),
    json_ld: s.json_ld && s.json_ld.length ? (s.json_ld.length === 1 ? s.json_ld[0] : `[${s.json_ld.join(',')}]`) : '',
    source_path: path,
  }
}

/* Conversion pipeline ---------------------------------------------------------------------------- */

const ds = new DesignSystem('Main')
const captures = [] // { key, viewports, after(elements) }

function queue(key, viewports, after, options = {}) {
  const trees = Converter.prepare(viewports)
  captures.push({ key, trees, after, options })
}

async function main() {
  const browser = await chromium.launch()
  const tasks = []
  try {
    /* Shell: header, footer, background (from a representative page); every family needs it. */
    {
      log('capturing the Main Website shell')
      const shell = await captureRoute(browser, `${MAIN}/tools/google-analytics`, ['header', 'footer', 'background', 'main'])
      bundle.settings.main_css = mainCss(shell)
      const menu = await captureMenu(browser)
      bundle.menus.push(menu)
      queue('main-header', shell.parts.header, (els) => headerTemplate(els, menu))
      queue('main-footer', { desktop: merge(shell.parts.footer.desktop, shell.parts.background.desktop), tablet: merge(shell.parts.footer.tablet, shell.parts.background.tablet), mobile: merge(shell.parts.footer.mobile, shell.parts.background.mobile) }, (els) => footerTemplate(els))
      /* Tools family: design template + card + records */
      if (ONLY.includes('tools')) {
        const allTools = (await supabase('tools_extended', 'select=*&order=name.asc')).filter((t) => t.published !== false && t.is_active !== false && !t.deleted_at)
        // The design is captured from /tools/google-analytics, so that record's text marks the fields.
        const sample = allTools.find((t) => t.slug === 'google-analytics') || allTools[0]
        const tools = allTools.slice(0, LIMIT)
        queue('design-tool', shell.parts.main, (els) => toolTemplate(els, sample))
        queue('card-tool', shell.parts.main, (els) => toolCard(els))
        tasks.push(() => toolRecords(tools))
      }
    }
    const ctx = { MAIN, LIMIT, ONLY, bundle, queue, media, link, log, supabase, captureRoute, seoFrom, headSeo }
    if (ONLY.includes('blogs')) tasks.push(() => families.blogFamily(ctx, browser))
    if (ONLY.includes('services') || ONLY.includes('pages')) tasks.push(() => families.routeFamilies(ctx, browser))
    for (const t of tasks) await t()
  } finally {
    await browser.close()
  }

  /* Design system across everything captured, then conversion. */
  for (const c of captures) new Converter({ ds, seed: c.key }).collect(c.trees)
  ds.finalize()
  bundle.kit = ds.kit()
  for (const c of captures) {
    const notes = []
    const converter = new Converter({ ds, seed: c.key, transformLink: link, transformImage: (u, alt) => media(u, alt), notes, formType: c.options.formType })
    const elements = converter.convertRoots(c.trees)
    c.after(elements)
    bundle.notes.push(...notes.map((n) => `${c.key}: ${n}`))
  }
  // Test records published on the Main Website by its end-to-end tests ("Local E2E Course",
  // "Local E2E Tool", slug local-e2e-…) are not content: they are not migrated, and menu links to
  // them are left out. Remove them from the Main Website itself as well.
  const isTestData = (s) => /(^|\/)local-e2e-/i.test(String(s || ''))
  const before = bundle.records.length
  bundle.records = bundle.records.filter((r) => !isTestData(r.slug) && !isTestData(r.main_path))
  for (const m of bundle.menus) m.items = m.items.filter((i) => !isTestData(i.url))
  // Their cards and logo tiles in designs (course grids, tool strips) go too: the innermost item of
  // a list (a container with 3+ items) that links to one or names one.
  const mentions = (e) => /local[- ]e2e/i.test(JSON.stringify(e))
  const prune = (els) => (els || []).filter((e) => {
    if (e.elements) e.elements = prune(e.elements)
    return !(els.length >= 3 && mentions(e))
  })
  for (const item of [...bundle.records, ...bundle.templates]) if (item.elementor_data && mentions(item.elementor_data)) item.elementor_data = prune(item.elementor_data)
  if (bundle.records.length !== before) bundle.notes.push(`left out ${before - bundle.records.length} end-to-end test record(s) (local-e2e-…); remove them from the Main Website`)
  fs.writeFileSync(OUT, JSON.stringify(bundle))
  log(`bundle written: ${OUT} (${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB) — media ${bundle.media.length}, menus ${bundle.menus.length}, templates ${bundle.templates.length}, records ${bundle.records.length}, kit colours ${bundle.kit.colors.length}, kit fonts ${bundle.kit.typography.length}`)
  for (const n of [...new Set(bundle.notes)].slice(0, 30)) log('note:', n)
}

function merge(a, b) {
  return { ...a, roots: [...a.roots, ...b.roots] }
}

/* Shell ------------------------------------------------------------------------------------------ */

function mainCss(shell) {
  const body = shell.parts.main.desktop.bodyStyle || {}
  return [
    '/* Main Website page background and base text, from www.acadvizen.com */',
    `html body,html body[class]{background-color:#020617!important;background-image:${body.backgroundImage && body.backgroundImage !== 'none' ? body.backgroundImage : 'none'}!important;background-attachment:fixed!important;color:${body.color || '#e2e8f0'};font-family:Inter,ui-sans-serif,system-ui,sans-serif}`,
    '.elementor-template-full-width .site-content,.elementor-template-full-width #content{background:transparent}',
    '.elementor-widget-text-editor p:last-child{margin-bottom:0}',
    'a{transition:color .2s ease,background-color .2s ease,opacity .2s ease}',
    '/* Header navigation (Header Footer Elementor menu) dropdown */',
    '.hfe-nav-menu .sub-menu{border-radius:14px;overflow:hidden}',
  ].join('\n')
}

/** The live header navigation, including the Courses dropdown (shown on hover). */
async function captureMenu(browser) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
  await page.goto(`${MAIN}/`, { waitUntil: 'load', timeout: 120000 })
  await page.waitForTimeout(1500)
  const top = await page.evaluate(() => [...document.querySelectorAll('header nav a, header nav button')].filter((a) => a.offsetParent && a.innerText.trim()).map((a) => ({ title: a.innerText.trim(), url: a.getAttribute('href') || '', tag: a.tagName })))
  const items = []
  for (const [i, t] of top.entries()) {
    if (/^acadvizen$/i.test(t.title)) continue
    const item = { key: `t${i}`, title: t.title, url: t.url || '#' }
    items.push(item)
    if (/^courses$/i.test(t.title)) {
      // The Courses mega menu is data-driven (components/cms/CourseMegaMenu.jsx); built below.
      item.url = '/courses'
      continue
    }
    if (t.tag === 'BUTTON') {
      await page.locator('header nav').getByText(t.title, { exact: true }).first().hover().catch(() => {})
      await page.waitForTimeout(800)
      const subs = await page.evaluate((exclude) => [...document.querySelectorAll('header a')].filter((a) => a.offsetParent && a.innerText.trim() && !exclude.includes(a.innerText.trim())).map((a) => ({ title: a.innerText.trim().split('\n')[0], url: a.getAttribute('href') || '#' })), top.map((x) => x.title))
      for (const [j, s] of subs.entries()) items.push({ key: `t${i}s${j}`, parent: item.key, title: s.title, url: s.url })
      if (item.url === '#' || !item.url) item.url = '/courses'
    }
  }
  try {
    const courses = (await (await fetch(`${MAIN}/api/cms/entities/courses?limit=200`)).json())
    const list = (Array.isArray(courses) ? courses : courses.data || courses.items || []).filter((c) => c && c.slug && c.is_active !== false && c.published !== false)
    const parent = items.find((x) => /^courses$/i.test(x.title))
    if (parent) {
      // Same entries as the Main mega menu: its two links, then every course the menu lists.
      items.push({ key: 'explore', parent: parent.key, title: 'Explore Programs', url: '/explore-programs' })
      items.push({ key: 'all-courses', parent: parent.key, title: 'Browse All Courses', url: '/courses' })
      for (const [j, c] of list.entries()) items.push({ key: `course${j}`, parent: parent.key, title: c.short_title || c.title, url: `/courses/${c.slug}` })
    }
  } catch (e) {
    bundle.notes.push(`menu: course list not read (${e.message})`)
  }
  await page.context().close()
  log(`menu: ${items.filter((x) => !x.parent).map((x) => x.title).join(', ')} (+${items.filter((x) => x.parent).length} dropdown items)`)
  return { key: 'main-website-menu', name: 'Main Website Menu', items: items.map((x) => ({ ...x, url: link(x.url) })) }
}

function headerTemplate(elements, menu) {
  // Replace the hard-coded links with the WordPress menu (edited in Appearance > Menus).
  const titles = menu.items.filter((x) => !x.parent).map((x) => x.title)
  const nav = findDeepestContainer(elements, (el) => {
    const texts = textsOf(el)
    return titles.every((t) => texts.includes(t))
  })
  if (nav) {
    const sample = []
    walk([nav.el], (x) => { if (x.elType === 'widget' && x.settings && (x.settings.text || x.settings.editor)) sample.push(x.settings) })
    const s = sample[0] || {}
    const g = s.__globals__ || {}
    replaceElement(elements, nav.el, {
      id: elementId('main-header-nav'),
      elType: 'widget',
      widgetType: 'navigation-menu',
      settings: {
        menu: 'main-website-menu',
        layout: 'horizontal',
        navmenu_align: 'right',
        submenu_icon: 'arrow',
        dropdown: 'mobile',
        resp_align: 'center',
        full_width_dropdown: 'yes',
        pointer: 'none',
        padding_horizontal_menu_item: { unit: 'px', size: 12 },
        padding_vertical_menu_item: { unit: 'px', size: 8 },
        menu_space_between: { unit: 'px', size: 4 },
        menu_typography_typography: s.typography_typography || 'custom',
        menu_typography_font_family: s.typography_font_family || 'Inter',
        menu_typography_font_size: s.typography_font_size || { unit: 'px', size: 16 },
        menu_typography_font_weight: s.typography_font_weight || '600',
        color_menu_item: s.text_color || s.button_text_color || '#F1F5F9',
        color_menu_item_hover: '#5EEAD4',
        color_dropdown_item: '#E2E8F0',
        background_color_dropdown_item: '#0B1220',
        color_dropdown_item_hover: '#5EEAD4',
        background_color_dropdown_item_hover: '#111C2E',
        dropdown_typography_typography: 'custom',
        dropdown_typography_font_family: 'Inter',
        dropdown_typography_font_size: { unit: 'px', size: 14 },
        toggle_color: '#F1F5F9',
        // The menu's own mobile toggle replaces the Main Website's hamburger button: on the right,
        // in the same small bordered box.
        hamburger_align: 'right',
        toggle_size: { unit: 'px', size: 18 },
        toggle_border_width: { unit: 'px', size: 1 },
        toggle_border_radius: { unit: 'px', size: 12 },
        toggle_background_color: 'rgba(255, 255, 255, 0.05)',
        custom_css: 'selector .hfe-nav-menu{flex-wrap:nowrap;white-space:nowrap}selector .hfe-nav-menu-icon{border-color:rgba(255,255,255,0.1)}',
        __globals__: g.typography_typography ? { menu_typography_typography: g.typography_typography } : {},
      },
      elements: [],
      isInner: false,
    })
    // The Main Website's mobile menu button (its "Menu" label is for screen readers) is replaced
    // by the menu widget's own toggle; keeping both would show two toggles on phones.
    const dropMenuButton = (els) => els.filter((el) => !(el.elType === 'widget' && el.widgetType === 'button' && /^\s*Menu\s*$/i.test(String(el.settings.text || '')) && el.settings.hide_desktop)).map((el) => ({ ...el, elements: dropMenuButton(el.elements || []) }))
    elements.splice(0, elements.length, ...dropMenuButton(elements))
  } else {
    bundle.notes.push('header: navigation links not found; kept as converted links')
  }
  bundle.templates.push({ key: 'main-header', post_type: 'elementor-hf', hfe_type: 'type_header', title: 'Main Website Header', target: 'main', elementor_template_type: 'wp-post', elementor_data: elements })
}

function footerTemplate(elements) {
  // The background glow sits behind the page content.
  walk(elements, (el) => {
    const s = el.settings || {}
    const tall = (s.min_height || {}).unit === 'vh' ? (s.min_height || {}).size >= 90 : (s.min_height || {}).size >= 600
    if (el.elType === 'container' && s.position === 'fixed' && /inset|z_index/.test(JSON.stringify(s)) && !textsOf(el).length && tall) {
      s.z_index = -1
    }
  })
  bundle.templates.push({ key: 'main-footer', post_type: 'elementor-hf', hfe_type: 'type_footer', title: 'Main Website Footer', target: 'main', elementor_template_type: 'wp-post', elementor_data: elements })
}

/* Tools ------------------------------------------------------------------------------------------ */

function relatedToolsSection(elements) {
  return findContainer(elements, (el) => el.settings && el.settings.html_tag === 'section' && textsOf(el).some((t) => /^Related Tools$/i.test(t)))
}

function toolTemplate(elements, sample) {
  // Record-specific text becomes fields; the logo, website link and related list become dynamic.
  replaceText(elements, sample.name, '[acv_field name="title"]')
  replaceText(elements, sample.slug, '[acv_field name="slug"]')
  if (sample.description) replaceText(elements, sample.description, '[acv_field name="excerpt"]')
  replaceLinks(elements, (u) => u && sample.website_url && u.replace(/\/$/, '') === sample.website_url.replace(/\/$/, ''), '#acv-field-website')
  walk(elements, (el) => {
    if (el.widgetType === 'image' && el.settings.image && /clearbit|logo|google/i.test(JSON.stringify(el.settings.image))) {
      el.settings.image = { url: '#acv-field-image_url', id: '' }
    }
  })
  const related = relatedToolsSection(elements)
  if (related) {
    // Keep the heading; the cards become a live list of tools in the same category.
    const grid = findContainer(related.el.elements, (el) => el.settings.container_type === 'grid' || (el.elements || []).length >= 3)
    if (grid) replaceElement(elements, grid.el, shortcodeWidget('tool-related-loop', '[acv_loop type="acv_tool" template="acv-template://card-tool" limit="6" columns="3" columns_tablet="2" columns_mobile="1" gap="16" same="category" orderby="date:DESC menu_order:ASC" exclude_current="after" link="no"]'))
  }
  bundle.templates.push({ key: 'design-tool', post_type: 'elementor_library', elementor_template_type: 'page', title: 'Main — Tool page design', target: 'main', elementor_data: elements })
  bundle.settings.design_templates.acv_tool = 'design-tool'
}

function toolCard(elements) {
  const related = relatedToolsSection(elements)
  const grid = related && findContainer(related.el.elements, (el) => el.settings.container_type === 'grid' || (el.elements || []).length >= 3)
  const card = grid && grid.el.elements[0]
  if (!card) {
    bundle.notes.push('tool card: related tools grid not found')
    return
  }
  const texts = textsOf(card)
  if (texts[0]) replaceText([card], texts[0], '[acv_field name="title"]')
  if (texts[1]) replaceText([card], texts[1], '[acv_field name="category"]')
  card.settings.html_tag = 'a'
  card.settings.link = { url: '#acv-field-url', is_external: '', nofollow: '' }
  delete card.settings.width
  card.isInner = false
  bundle.templates.push({ key: 'card-tool', post_type: 'elementor_library', elementor_template_type: 'section', title: 'Main — Tool card', target: 'main', elementor_data: [card] })
}

/**
 * The logo the Main Website really shows for a tool: the same candidate order as
 * lib/toolMedia.js (local /tools/<key>.png or a mapped override, the stored logo, the logo service,
 * the Acadvizen mark); the first address that loads wins, as in the browser.
 */
const TOOL_LOGO_OVERRIDES = (() => {
  const src = fs.readFileSync(new URL('../../lib/toolMedia.js', import.meta.url), 'utf8')
  return Object.fromEntries([...src.matchAll(/^\s+([a-z0-9]+): '([^']+)',$/gm)].map((m) => [m[1], m[2]]))
})()
const exists = new Map()
async function loads(url) {
  if (!exists.has(url)) {
    try {
      const r = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(10000) })
      exists.set(url, r.ok && /^image\//.test(r.headers.get('content-type') || ''))
    } catch {
      exists.set(url, false)
    }
  }
  return exists.get(url)
}
async function toolLogo(t) {
  const key = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
  const keys = [t.slug, t.name].map(key).filter(Boolean)
  const candidates = [...keys.map((k) => TOOL_LOGO_OVERRIDES[k] || `/tools/${k}.png`), t.logo_url, '/logo-mark.png'].filter(Boolean).map(absolute)
  for (const c of [...new Set(candidates)]) if (await loads(c)) return c
  return absolute('/logo-mark.png')
}

async function toolRecords(tools) {
  // The Main Website lists tools by created_at, newest first, exactly as the database returns them
  // (many share one timestamp, so the database's own order breaks the tie). WordPress dates keep
  // seconds only: that rank goes into the menu order and breaks ties the same way.
  const ordered = await supabase('tools_extended', 'select=slug&order=created_at.desc')
  const rank = new Map(ordered.map((t, i) => [t.slug, i]))
  for (const t of tools) {
    const path = `/tools/${t.slug}`
    const html = await (await fetch(`${MAIN}${path}`)).text()
    const seo = headSeo(html, path)
    bundle.records.push({
      key: `tool-${t.slug}`,
      post_type: 'acv_tool',
      title: t.name,
      slug: t.slug,
      content: t.description || '',
      excerpt: t.description || '',
      date: t.created_at,
      order: rank.get(t.slug) || 0,
      target: 'main',
      main_path: path,
      replace: true,
      featured_media: media(await toolLogo(t), t.name).url.replace('acv-media://', ''),
      meta: { _acv_tool_url: t.website_url || '', _acv_tool_category: t.category || '', _acv_tool_brand_color: t.brand_color || '' },
      seo,
    })
  }
  log(`tools: ${tools.length} records`)
}

/** SEO read from a page's HTML head (no browser needed). */
function headSeo(html, path) {
  const meta = (re) => ((html.match(re) || [])[1] || '').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"')
  // Every JSON-LD block, whatever the order of its attributes (<script id="…" type="application/ld+json">).
  const ld = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1].trim())
  return {
    title: oneSiteName(meta(/<title>([^<]*)<\/title>/)),
    description: meta(/<meta name="description" content="([^"]*)"/),
    canonical: absolute(meta(/<link rel="canonical" href="([^"]*)"/)),
    og_title: oneSiteName(meta(/<meta property="og:title" content="([^"]*)"/)),
    og_description: meta(/<meta property="og:description" content="([^"]*)"/),
    ...ogImage(meta(/<meta property="og:image" content="([^"]*)"/)),
    twitter_title: oneSiteName(meta(/<meta name="twitter:title" content="([^"]*)"/)),
    twitter_description: meta(/<meta name="twitter:description" content="([^"]*)"/),
    noindex: /<meta name="robots" content="[^"]*noindex/i.test(html),
    json_ld: ld.length ? (ld.length === 1 ? ld[0] : `[${ld.join(',')}]`) : '',
    source_path: path,
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
