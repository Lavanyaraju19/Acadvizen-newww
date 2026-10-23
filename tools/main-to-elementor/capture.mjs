/**
 * Captures a live Main Website route (read-only GET) at the three Elementor widths, plus the SEO
 * the route currently publishes (title, description, canonical, robots, Open Graph, JSON-LD).
 */
import { extractInPage } from './extract.mjs'
import { VIEWPORTS, CAPTURE_HEIGHT } from './convert.mjs'
import { MAIN_FALLBACK_PARAM } from '../../lib/wordpress/bridgeRouting.js'

/**
 * The address of Main's own page: with the marker, Main skips the WordPress Render Bridge. Without it
 * a page already moved to WordPress would be captured as WordPress draws it (e.g. no Main header or
 * footer), not as the Main Website does. A page WordPress alone has answers 404 there (skipped).
 */
export function mainOwn(url) {
  const u = new URL(url)
  u.searchParams.set(MAIN_FALLBACK_PARAM, '1')
  return u.toString()
}

/** Analytics, advertising and session-recording endpoints, blocked while capturing. */
export const TRACKING = /google-analytics\.com|googletagmanager\.com|google\.com\/(ccm|rmkt|pagead)|doubleclick\.net|googleadservices\.com|clarity\.ms|connect\.facebook\.net|facebook\.com\/tr|static\.hotjar\.com/

export const MAIN_SHELL = {
  header: ['.acadvizen-noise > div.fixed.inset-x-0.top-0', '.acadvizen-noise > div[class*="h-[110px]"]'],
  footer: ['.acadvizen-noise > footer', '.acadvizen-noise > div.fixed.right-0', '.acadvizen-noise > .dock-nav-wrap'],
  background: ['.acadvizen-noise > div.pointer-events-none.fixed.inset-0'],
  main: ['.acadvizen-noise > main'],
}

async function settle(page) {
  // Trigger lazy images and scroll-driven reveals, then return to the top. Lazy images that are
  // off to the side (logo marquees) never come into view by scrolling, so they load eagerly.
  await page.evaluate(() => { for (const img of document.querySelectorAll('img[loading="lazy"]')) img.loading = 'eager' })
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < height; y += 500) {
    await page.evaluate((top) => window.scrollTo(0, top), y)
    await page.waitForTimeout(60)
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(700)
  // Freeze animations so every element is measured in its final state.
  // Reveal animations set an inline opacity (and a slide) that the server writes as "opacity:0" and the
  // browser as "opacity: 0.4" mid-way; either is the animation's start, never the design (a testimonial
  // card captured half faded, 21 Oct 2026).
  await page.addStyleTag({ content: '*,*::before,*::after{animation-play-state:paused!important;transition:none!important}[style*="opacity: 0"],[style*="opacity:0"]{opacity:1!important}' }).catch(() => {})
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('[style*="transform"]')) {
      if (/translate|scale/.test(el.style.transform) && el.closest('main,footer,header')) el.style.transform = 'none'
    }
  })
  await page.waitForTimeout(300)
}

/**
 * Accordions (FAQ, course modules): a list of items, each a button that opens its own panel. The
 * Main Website renders only the open panel, so each item is opened in turn and its title and
 * content are read; then the original state is restored. The list is marked data-acv-accordion,
 * and extract.mjs turns it into one "accordion" node (an Elementor Accordion widget).
 */
export async function readAccordions(page) {
  await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms))
    const textOf = (el) => (el ? el.innerText.replace(/\s+/g, ' ').trim() : '')
    const clean = (el) => {
      const keep = new Set(['P', 'UL', 'OL', 'LI', 'STRONG', 'B', 'EM', 'I', 'A', 'BR', 'H3', 'H4', 'H5', 'SPAN'])
      const walk = (node) => {
        let out = ''
        for (const n of node.childNodes) {
          if (n.nodeType === 3) { out += n.textContent.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]); continue }
          if (n.nodeType !== 1 || ['SVG', 'BUTTON', 'SCRIPT', 'STYLE', 'SUMMARY'].includes(n.tagName.toUpperCase())) continue
          const tag = n.tagName.toUpperCase()
          if (!keep.has(tag)) { const inner = walk(n); out += getComputedStyle(n).display.startsWith('inline') ? inner : `<p>${inner}</p>`; continue }
          const t = tag.toLowerCase()
          const href = t === 'a' && n.getAttribute('href') ? ` href="${n.getAttribute('href').replace(/"/g, '&quot;')}"` : ''
          out += t === 'br' ? '<br>' : t === 'span' ? walk(n) : `<${t}${href}>${walk(n)}</${t}>`
        }
        return out
      }
      return walk(el).replace(/<p>\s*<\/p>/g, '').replace(/\s+/g, ' ').trim()
    }
    const styleOf = (el, keys) => { if (!el) return {}; const s = getComputedStyle(el); return Object.fromEntries(keys.map((k) => [k, s[k]])) }
    window.__acvAccordions = []
    // Items = elements whose first child is a toggle button; at least two of them in one list. An item
    // may sit in wrappers of its own (a reveal animation around each FAQ item: the course pages,
    // 20 Oct 2026), so the list is the parent of the item's outermost single-child wrapper.
    const outermost = (item) => { let n = item; while (n.parentElement && n.parentElement.children.length === 1 && !['MAIN', 'SECTION', 'BODY'].includes(n.parentElement.tagName)) n = n.parentElement; return n }
    const lists = new Map()
    for (const b of document.querySelectorAll('main button')) {
      const item = b.parentElement
      if (!item || item.firstElementChild !== b || !item.parentElement) continue
      // Through wrappers only for real disclosure buttons, so separate single toggles (e.g. two
      // cards with a "Read more" each) are never paired into one accordion.
      const top = b.hasAttribute('aria-expanded') ? outermost(item) : item
      if (!top.parentElement) continue
      if (!lists.has(top.parentElement)) lists.set(top.parentElement, [])
      lists.get(top.parentElement).push({ b, item, top })
    }
    for (const [list, entries] of lists) {
      // Every entry is its own child of the list (no two toggles inside one item).
      if (entries.length < 2 || new Set(entries.map((e) => e.top)).size !== entries.length) continue
      const panelOf = ({ b, item }) => (b.getAttribute('aria-controls') && document.getElementById(b.getAttribute('aria-controls'))) || [...item.children].filter((c) => c !== b).pop() || null
      const isOpen = (e) => { const p = panelOf(e); return b2(e) || Boolean(p && p.offsetHeight > 0 && textOf(p)) }
      const b2 = ({ b }) => b.getAttribute('aria-expanded') === 'true'
      const initiallyOpen = entries.map(isOpen)
      const items = []
      let toggles = true
      for (const e of entries) {
        if (!isOpen(e)) { e.b.click(); await wait(200) }
        const panel = panelOf(e)
        if (!panel || !textOf(panel)) { toggles = false; break }
        // The title is the button's heading; any other text in the button (a subtitle such as
        // "180 DAYS | 120+ Tools") opens the item's content.
        const heading = e.b.querySelector('h2,h3,h4,h5') || e.b.querySelector('span,p') || e.b
        const title = textOf(heading)
        const subtitle = textOf(e.b).replace(title, '').trim()
        // A panel laid out as a grid of cards (course modules: one card per point, with a coloured
        // dot) keeps that look: its points become a list the converter styles as the same cards.
        const grid = getComputedStyle(panel).display === 'grid' ? panel : [...panel.children].find((c) => getComputedStyle(c).display === 'grid')
        const cardEls = grid ? [...grid.children].filter((c) => textOf(c)) : []
        let cards = null
        if (cardEls.length >= 2 && cardEls.every((c) => getComputedStyle(c).backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(getComputedStyle(c).borderTopWidth) > 0)) {
          const cs = getComputedStyle(cardEls[0])
          const gs = getComputedStyle(grid)
          const dot = (c) => { const d = [...c.querySelectorAll('span')].find((s) => !textOf(s) && s.offsetWidth > 0 && s.offsetWidth <= 16); return d ? getComputedStyle(d).backgroundColor : '' }
          cards = {
            items: cardEls.map((c) => textOf(c).replace(/[&<>]/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[x])),
            dots: cardEls.slice(0, 2).map(dot),
            columns: gs.gridTemplateColumns.split(' ').length,
            gap: gs.rowGap,
            panelPadding: gs.padding,
            panelBorderTop: `${gs.borderTopWidth} ${gs.borderTopStyle} ${gs.borderTopColor}`,
            card: { bg: cs.backgroundColor, border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`, radius: cs.borderTopLeftRadius, padding: cs.padding, color: cs.color, fontSize: cs.fontSize, lineHeight: cs.lineHeight },
          }
        }
        // The subtitle stays in the title row (visible while the item is closed), as on the Main Website.
        const subEl = subtitle ? [...e.b.querySelectorAll('p,span,div,small')].find((x) => x !== heading && !x.contains(heading) && textOf(x) === subtitle) : null
        items.push({ title, subtitle, subtitleStyle: subEl ? styleOf(subEl, ['color', 'fontSize', 'fontWeight', 'lineHeight', 'marginTop']) : null, full: textOf(e.b), cards, html: cards ? `<ul class="acv-cards">${cards.items.map((t) => `<li>${t}</li>`).join('')}</ul>` : clean(panel) })
      }
      // Restore what the visitor first sees: close what was closed, reopen what was open.
      for (const [i, e] of entries.entries()) if (isOpen(e) !== initiallyOpen[i]) { e.b.click(); await wait(200) }
      if (!toggles || items.length < 2) continue
      const first = entries[0]
      list.setAttribute('data-acv-accordion', String(window.__acvAccordions.length))
      window.__acvAccordions.push({
        items,
        firstOpen: initiallyOpen[0],
        multiple: initiallyOpen.filter(Boolean).length > 1,
        item: styleOf(first.item, ['backgroundColor', 'borderTopWidth', 'borderTopColor', 'borderTopLeftRadius', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']),
        title: styleOf(first.b.querySelector('h2,h3,h4,h5') || first.b.querySelector('span,p') || first.b, ['color', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight']),
        button: styleOf(first.b, ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'backgroundColor']),
        content: styleOf(panelOf(first), ['color', 'fontSize', 'lineHeight', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop']),
        gap: getComputedStyle(list).rowGap !== 'normal' ? getComputedStyle(list).rowGap : getComputedStyle(entries[1].top).marginTop,
        titleTag: ((first.b.querySelector('h2,h3,h4,h5') || {}).tagName || 'div').toLowerCase(),
      })
    }
    // Native <details>/<summary> lists (FAQs): the same Accordion, closed answers staying closed.
    // Without this, the answers were converted as plain text and shown open to every visitor.
    for (const list of new Set([...document.querySelectorAll('main details')].map((d) => d.parentElement).filter(Boolean))) {
      const entries = [...list.children]
      if (entries.length < 2 || list.hasAttribute('data-acv-accordion') || !entries.every((d) => d.tagName === 'DETAILS' && d.querySelector(':scope > summary'))) continue
      const initiallyOpen = entries.map((d) => d.open)
      for (const d of entries) d.open = true
      const summaryOf = (d) => d.querySelector(':scope > summary')
      const panelOf = (d) => [...d.children].find((c) => c.tagName !== 'SUMMARY') || null
      const items = entries.map((d) => {
        const heading = summaryOf(d).querySelector('h2,h3,h4,h5') || summaryOf(d)
        return { title: textOf(heading), subtitle: '', subtitleStyle: null, full: textOf(summaryOf(d)), cards: null, html: clean(d) }
      })
      const first = entries[0]
      const content = styleOf(panelOf(first), ['color', 'fontSize', 'lineHeight', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop'])
      entries.forEach((d, i) => { d.open = initiallyOpen[i] })
      if (items.some((it) => !it.title || !it.html)) continue
      list.setAttribute('data-acv-accordion', String(window.__acvAccordions.length))
      window.__acvAccordions.push({
        items,
        firstOpen: initiallyOpen[0],
        // Each <details> opens on its own, so several answers can be open at once.
        multiple: true,
        item: styleOf(first, ['backgroundColor', 'borderTopWidth', 'borderTopColor', 'borderTopLeftRadius', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']),
        title: styleOf(summaryOf(first).querySelector('h2,h3,h4,h5') || summaryOf(first), ['color', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight']),
        button: styleOf(summaryOf(first), ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'backgroundColor']),
        content,
        gap: getComputedStyle(list).rowGap !== 'normal' ? getComputedStyle(list).rowGap : getComputedStyle(entries[1]).marginTop,
        titleTag: ((summaryOf(first).querySelector('h2,h3,h4,h5') || {}).tagName || 'div').toLowerCase(),
      })
    }
  })
}

/**
 * Slideshows (e.g. /achievements' alumni stories): a section with "Previous …" / "Next …" buttons that
 * swap what one part of it shows. A screenshot only ever sees the first story, so every state is read
 * by clicking Next until the slideshow comes back (or stops), and what changed per state is kept: the
 * changed texts and media addresses, in page order. The smallest element holding every change is the
 * "stage" (marked data-acv-slideshow); its scripted buttons are marked data-acv-skip, since the
 * Elementor carousel that replaces it brings its own arrows. The first state is restored at the end.
 */
export async function readSlideshows(page) {
  await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms))
    const visible = (e) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden'
    window.__acvSlideshows = []
    const labelled = (re) => [...document.querySelectorAll('main button[aria-label]')].filter((b) => re.test(b.getAttribute('aria-label').trim()) && visible(b))
    for (const next of labelled(/^next\b/i)) {
      const section = next.closest('section') || next.parentElement
      const prev = labelled(/^prev(ious)?\b/i).find((b) => section.contains(b))
      if (!prev || section.hasAttribute('data-acv-slideshow') || section.querySelector('[data-acv-slideshow]')) continue
      // Leaves (text) and media, in page order; their elements, to find what changed.
      const read = () => {
        const leaves = [...section.querySelectorAll('*')].filter((e) => visible(e) && !e.closest('button[aria-label]') && ((e.children.length === 0 && e.textContent.trim()) || ['VIDEO', 'IMG'].includes(e.tagName)))
        return leaves.map((e) => ({ el: e, value: e.tagName === 'VIDEO' ? (e.currentSrc || (e.querySelector('source') || {}).src || '') : e.tagName === 'IMG' ? (e.currentSrc || e.src) : e.textContent.replace(/\s+/g, ' ').trim(), media: ['VIDEO', 'IMG'].includes(e.tagName) }))
      }
      const key = (s) => s.map((x) => x.value).join('\u0001')
      const states = [read()]
      for (let i = 0; i < 12; i++) {
        next.click(); await wait(600)
        const s = read()
        if (key(s) === key(states[0]) || key(s) === key(states[states.length - 1])) break
        states.push(s)
      }
      // Back to the first state (a looping slideshow is there already; one that stops at its end is not).
      for (let i = 0; i < 12 && key(read()) !== key(states[0]); i++) { prev.click(); await wait(600) }
      if (states.length < 2 || states.some((s) => s.length !== states[0].length)) continue
      const changed = states[0].map((x, i) => states.some((s) => s[i].value !== x.value) ? i : -1).filter((i) => i >= 0)
      if (!changed.length) continue
      // Stage: the smallest element holding every changed leaf.
      let stage = states[0][changed[0]].el
      while (stage && !changed.every((i) => stage.contains(states[0][i].el))) stage = stage.parentElement
      if (!stage || !section.contains(stage)) continue
      stage.setAttribute('data-acv-slideshow', String(window.__acvSlideshows.length))
      for (const b of stage.querySelectorAll('button')) b.setAttribute('data-acv-skip', '1')
      for (const b of [next, prev]) b.setAttribute('data-acv-skip', '1')
      window.__acvSlideshows.push({
        // Per state: [first-state value, this state's value] for each changed text / media address.
        slides: states.map((s) => changed.map((i) => ({ from: states[0][i].value, to: s[i].value, media: states[0][i].media }))),
        titles: states.map((s) => (s.find((x, i) => changed.includes(i) && !x.media) || {}).value || ''),
      })
    }
  })
}

/** SEO fields as the server sent them (first of each tag in the HTML), '' when absent. */
export function serverSeo(html = '') {
  const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  const tag = (re) => decode(((html.match(re) || [])[1] || '').trim())
  const meta = (attr, name) => tag(new RegExp(`<meta[^>]+${attr}="${name}"[^>]+content="([^"]*)"`, 'i')) || tag(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+${attr}="${name}"`, 'i'))
  return {
    title: tag(/<title[^>]*>([^<]*)<\/title>/i),
    description: meta('name', 'description'),
    canonical: tag(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i),
    robots: meta('name', 'robots'),
    og_title: meta('property', 'og:title'),
    og_description: meta('property', 'og:description'),
    og_image: meta('property', 'og:image'),
    twitter_title: meta('name', 'twitter:title'),
    twitter_description: meta('name', 'twitter:description'),
  }
}

/** Server values where the server sent them; the browser's for the rest (and its JSON-LD list). */
export function mergeSeo(browser = {}, server = {}) {
  const out = { ...browser }
  for (const [key, value] of Object.entries(server)) if (value) out[key] = value
  return out
}

export async function readSeo(page) {
  return page.evaluate(() => {
    const meta = (sel) => document.querySelector(sel)?.getAttribute('content') || ''
    return {
      title: document.title,
      description: meta('meta[name="description"]'),
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
      robots: meta('meta[name="robots"]'),
      og_title: meta('meta[property="og:title"]'),
      og_description: meta('meta[property="og:description"]'),
      og_image: meta('meta[property="og:image"]'),
      twitter_title: meta('meta[name="twitter:title"]'),
      twitter_description: meta('meta[name="twitter:description"]'),
      json_ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent.trim()).filter(Boolean),
    }
  })
}

/**
 * @returns {Promise<{status:number, finalUrl:string, seo:object, parts:Record<string,{desktop,tablet,mobile}>}>}
 */
/** Text of the top-most hidden blocks (60+ characters) inside the given roots, first 70 characters each. */
export function findHiddenBlocks(roots) {
  const out = []
  // Not shown = no box on the page (display none, or inside something that is not shown) or
  // invisible. "display: contents" wrappers have no box of their own, but their children show.
  const shown = (el) => {
    const style = getComputedStyle(el)
    return style.visibility !== 'hidden' && (style.display === 'contents' || el.getClientRects().length > 0)
  }
  for (const selector of roots) {
    for (const root of document.querySelectorAll(selector)) {
      for (const el of root.querySelectorAll('*')) {
        // Only the top-most hidden block: its parent is shown (everything inside it is part of it).
        if (out.length >= 10 || shown(el) || !el.parentElement || !shown(el.parentElement)) continue
        if (['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT', 'svg'].includes(el.tagName)) continue
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim()
        if (text.length < 60) continue
        // The block's first piece of text (usually its heading) identifies it in the converted design.
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
        let first = ''
        while (walker.nextNode() && first.length < 12) first = walker.currentNode.textContent.replace(/\s+/g, ' ').trim()
        out.push((first.length >= 12 ? first : text).slice(0, 70))
      }
    }
  }
  return out
}

export async function captureRoute(browser, url, parts = ['main']) {
  const context = await browser.newContext({ viewport: { width: VIEWPORTS.desktop, height: CAPTURE_HEIGHT }, deviceScaleFactor: 1 })
  // A capture is not a visit: analytics, ad and session-recording calls never leave the browser.
  await context.route(TRACKING, (route) => route.abort())
  const page = await context.newPage()
  try {
    // One slow load (a video, a stalled third-party script) must not end a whole export: on a
    // timeout the page is opened once more and used as soon as its HTML is in.
    const response = await page.goto(mainOwn(url), { waitUntil: 'load', timeout: 120000 })
      .catch((e) => { if (!/Timeout/i.test(String(e && e.name) + String(e && e.message))) throw e; return page.goto(mainOwn(url), { waitUntil: 'domcontentloaded', timeout: 120000 }) })
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    await settle(page)
    await readAccordions(page)
    await readSlideshows(page)
    // The page's own server HTML wins over what scripts change in the browser afterwards (a legacy
    // client component can rewrite the description): migrated pages publish what Main's server sends.
    const seo = mergeSeo(await readSeo(page), serverSeo(response ? await response.text().catch(() => '') : ''))
    // Blocks in the page that are hidden until a visitor clicks (tabs, collapsed panels) are not
    // converted: they are listed so they are never lost silently.
    const hidden = await page.evaluate(findHiddenBlocks, MAIN_SHELL.main)
    const out = { status: response ? response.status() : 0, finalUrl: page.url(), seo, hidden, parts: {} }
    for (const part of parts) out.parts[part] = {}
    for (const [device, width] of Object.entries(VIEWPORTS)) {
      if (device !== 'desktop') {
        await page.setViewportSize({ width, height: CAPTURE_HEIGHT })
        await page.waitForTimeout(900)
        await settle(page)
      }
      for (const part of parts) {
        out.parts[part][device] = await page.evaluate(extractInPage, { roots: MAIN_SHELL[part] || [part], viewport: device })
      }
      // Hidden at this width too? A block hidden at every width is switched off on Main itself.
      if (device !== 'desktop') {
        const here = new Set(await page.evaluate(findHiddenBlocks, MAIN_SHELL.main))
        out.hiddenEverywhere = (out.hiddenEverywhere || hidden).filter((text) => here.has(text))
      }
    }
    return out
  } finally {
    await context.close()
  }
}
