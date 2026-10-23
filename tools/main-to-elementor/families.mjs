/**
 * Content families migrated from the live Main Website: blogs, service/location pages, individual
 * pages (homepage, about, contact, …) and courses. Each function receives the builder context:
 *   { MAIN, LIMIT, ONLY, bundle, queue, media, link, log, supabase, captureRoute, seoFrom, headSeo }
 */
import fs from 'node:fs'
import { elementId } from './convert.mjs'
import { mainOwn } from './capture.mjs'
import { walk, widgetText, textsOf, replaceText, findContainer, findDeepestContainer, replaceElement, shortcodeWidget } from './elementor-json.mjs'

/* Blogs ------------------------------------------------------------------------------------------ */

/** Rendered article body + the CSS it is drawn with, read from a live post (read-only). */
export async function readArticle(ctx, browser, path, withStyles = false) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
  try {
    await page.goto(`${ctx.MAIN}${path}`, { waitUntil: 'load', timeout: 120000 })
    await page.waitForTimeout(1200)
    const result = await page.evaluate((styles) => {
      const article = document.querySelector('main article') || document.querySelector('main')
      let body = null
      for (const el of article.querySelectorAll('div')) if (!body || el.children.length > body.children.length) body = el
      const KEEP = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'UL', 'OL', 'LI', 'A', 'STRONG', 'B', 'EM', 'I', 'U', 'IMG', 'FIGURE', 'FIGCAPTION', 'BLOCKQUOTE', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'HR', 'BR', 'CODE', 'PRE', 'SPAN', 'SUP', 'SUB'])
      const esc = (t) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
      const attr = (v) => String(v || '').replace(/"/g, '&quot;')
      const clean = (node) => {
        let out = ''
        for (const n of node.childNodes) {
          if (n.nodeType === 3) { out += esc(n.textContent); continue }
          if (n.nodeType !== 1) continue
          if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'BUTTON', 'SVG', 'NAV', 'FORM'].includes(n.tagName)) continue
          if (!KEEP.has(n.tagName)) {
            out += n.tagName === 'DIV' && n.children.length === 0 && n.textContent.trim() ? `<p>${clean(n)}</p>` : clean(n)
            continue
          }
          const tag = n.tagName.toLowerCase()
          let attrs = ''
          if (tag === 'a' && n.getAttribute('href')) attrs += ` href="${attr(n.getAttribute('href'))}"`
          if (tag === 'a' && n.getAttribute('target')) attrs += ` target="${attr(n.getAttribute('target'))}" rel="noopener"`
          if (tag === 'img') attrs += ` src="${attr(n.currentSrc || n.src)}" alt="${attr(n.alt)}"${n.naturalWidth ? ` width="${n.naturalWidth}" height="${n.naturalHeight}"` : ''} loading="lazy"`
          if (tag === 'img' || tag === 'br' || tag === 'hr') { out += `<${tag}${attrs}>`; continue }
          if (tag === 'span' && !n.attributes.length) { out += clean(n); continue }
          out += `<${tag}${attrs}>${clean(n)}</${tag}>`
        }
        return out
      }
      const html = body ? clean(body) : ''
      let css = ''
      if (styles && body) {
        const P = 'body .elementor .elementor-widget.acv-prose'
        // No margins here: the spacing between the article's blocks is the "flow" rule below (the
        // Main Website spaces every block the same, e.g. Tailwind's space-y-8); a margin on each
        // element would override it.
        const props = ['fontFamily', 'color', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'paddingLeft', 'listStyleType', 'textDecorationLine', 'fontStyle', 'backgroundColor', 'borderLeftWidth', 'borderLeftStyle', 'borderLeftColor', 'borderRadius']
        const kebab = (k) => k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
        for (const sel of ['h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'a', 'strong', 'img', 'blockquote', 'table', 'th', 'td', 'figcaption', 'hr', 'code']) {
          const el = body.querySelector(sel)
          if (!el) continue
          const s = getComputedStyle(el)
          const rules = props.map((p) => [p, s[p]]).filter(([p, v]) => v && v !== 'none' && v !== 'normal' && v !== 'rgba(0, 0, 0, 0)' && !(p.startsWith('borderLeft') && s.borderLeftWidth === '0px')).map(([p, v]) => `${kebab(p)}:${v}`)
          // Prefixed so it outranks Elementor's Site Settings rules (".elementor-kit-N h2", widget typography).
          css += `${P} ${sel}{${rules.join(';')}}\n`
        }
        // The article sits in the Text Editor widget: directly in it, or in its .elementor-widget-container.
        const flow = (rest) => `${P}.acv-prose>${rest},${P}.acv-prose>.elementor-widget-container>${rest}`
        const second = body.children[1]
        if (second) css += `${flow('*+*')}{margin-top:${getComputedStyle(second).marginTop}}\n`
        css += `${P}{font-family:${getComputedStyle(body).fontFamily}}${flow('*:first-child')}{margin-top:0}\n`
        // Article images: full width in the same card the Main Website draws around them. The card
        // is the image's block (body's child) when that is framed, else the nearest framed wrapper;
        // the image keeps the card's look, inset by every padding between the card and the picture.
        const img = body.querySelector('img')
        const framed = (el) => { const c = getComputedStyle(el); return c.backgroundColor !== 'rgba(0, 0, 0, 0)' || c.borderTopWidth !== '0px' }
        let card = null
        for (let el = img && img.parentElement; el && el !== body; el = el.parentElement) if (framed(el) && (!card || el.parentElement === body || getComputedStyle(el).borderTopWidth !== '0px')) card = el
        const cs = card ? getComputedStyle(card) : null
        let inset = 0
        for (let el = img; card && el && el !== card.parentElement; el = el.parentElement) inset += parseFloat(getComputedStyle(el).paddingLeft) || 0
        css += `${P} img{display:block;width:100%;height:auto;max-width:100%;box-sizing:border-box${cs ? `;padding:${Math.round(inset) || 16}px;background:${cs.backgroundColor};border:${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor};border-radius:${cs.borderTopLeftRadius}` : ''}}\n`
        window.__acvImageCard = card
        const toc = document.querySelector('aside ul a, aside ol a')
        if (toc) {
          const t = getComputedStyle(toc)
          css += `.acv-toc ol{list-style:none;margin:0;padding:0}.acv-toc li{margin:0 0 8px}.acv-toc a{color:${t.color};font-size:${t.fontSize};line-height:${t.lineHeight};text-decoration:none}.acv-toc .acv-toc__h3{padding-left:12px}\n`
        }
      }
      return { html, css, title: (document.querySelector('h1') || {}).innerText || '' }
    }, withStyles)
    if (withStyles) {
      // The image inset is smaller on phones (e.g. Tailwind "p-2 sm:p-3"): measure it at 390 too.
      await page.setViewportSize({ width: 390, height: 844 })
      await page.waitForTimeout(500)
      const phone = await page.evaluate(() => {
        const card = window.__acvImageCard
        const img = card && card.querySelector('img')
        let inset = 0
        for (let el = img; el && el !== card.parentElement; el = el.parentElement) inset += parseFloat(getComputedStyle(el).paddingLeft) || 0
        return img ? Math.round(inset) : 0
      })
      if (phone) result.css += `@media (max-width:639px){body .elementor .elementor-widget.acv-prose img{padding:${phone}px}}\n`
    }
    return result
  } finally {
    await page.context().close()
  }
}

/** Article HTML with images moved to the media library and same-site links made relative. */
function articleContent(ctx, html) {
  return String(html || '')
    .replace(/<img([^>]*?)src="([^"]+)"/g, (m, before, src) => `<img${before}src="${ctx.media(src).url}"`)
    .replace(/href="([^"]+)"/g, (m, h) => `href="${ctx.link(h)}"`)
}

function cardGrid(elements) {
  return findContainer(elements, (el) => el.settings.container_type === 'grid' && (el.elements || []).length >= 6)
}

/** The blog posts (/blog/<slug>) a piece of design links to. */
const blogLinks = (el) => new Set([...JSON.stringify(el).matchAll(/\/blog\/([a-z0-9-]+)(?=[\\"'#?/])/g)].map((m) => m[1]).filter((s) => !['author', 'category', 'tag'].includes(s)))

/**
 * The row or grid of blog post cards, however many posts the website has: a container whose items
 * are each a card for one post, all different. Counting items instead picks the wrong box on a
 * website with few posts (e.g. one card's own text block: date, title, summary, link).
 */
export function blogCardGrid(elements) {
  // Main draws each post card as one link: the grid is the box whose items are all such cards. With
  // one post this is still exact (a wrapper around the row is not itself a link to a post).
  const isLinkedCard = (el) => el.elType === 'container' && el.settings && el.settings.html_tag === 'a' && /\/blog\/(?!author\/|category\/|tag\/)[a-z0-9-]+\/?$/.test((el.settings.link && el.settings.link.url) || '')
  const linked = findContainer(elements, (el) => (el.elements || []).length > 0 && el.elements.every(isLinkedCard))
  if (linked) return linked
  const isGrid = (el) => {
    const items = el.elements || []
    const posts = items.map((c) => (c.elType === 'container' ? [...blogLinks(c)] : []))
    return items.length > 0 && posts.every((p) => p.length === 1) && new Set(posts.map((p) => p[0])).size === items.length
  }
  let found = findContainer(elements, isGrid)
  // A wrapper around a one-card row matches too: the row itself is the grid.
  while (found && found.el.elements.length === 1 && isGrid(found.el.elements[0])) found = { el: found.el.elements[0], parent: found.el }
  return found
}

/** A loop of blog cards needs the card design; without it the captured cards are kept (never empty). */
const hasBlogCard = (ctx) => ctx.bundle.templates.some((t) => t.key === 'card-blog')

export async function blogFamily(ctx, browser) {
  const { MAIN, bundle, log } = ctx
  const listHtml = await (await fetch(mainOwn(`${MAIN}/blog`))).text()
  const liveSlugs = [...new Set([...listHtml.matchAll(/href="\/blog\/([a-z0-9-]+)"/g)].map((m) => m[1]))]
  const rows = (await ctx.supabase('blogs', 'select=*&order=created_at.desc')).filter((b) => !b.deleted_at)
  log(`blogs: ${liveSlugs.length} live on /blog, ${rows.length} in the database`)
  const sampleSlug = liveSlugs[0]
  const sample = rows.find((r) => r.slug === sampleSlug)
  const post = await ctx.captureRoute(browser, `${MAIN}/blog/${sampleSlug}`, ['main'])
  const sampleArticle = await readArticle(ctx, browser, `/blog/${sampleSlug}`, true)
  // Marked, so importing another bundle afterwards keeps it (merge_main_css in the plugin).
  bundle.settings.main_css += `\n/* acv:blog-typography */\n/* Blog article typography (captured from a live post) */\n${sampleArticle.css}/* acv:end */`
  ctx.queue('design-blog', post.parts.main, (els) => blogTemplate(ctx, els, sample, sampleArticle))
  const listing = await ctx.captureRoute(browser, `${MAIN}/blog`, ['main'])
  ctx.queue('card-blog', listing.parts.main, (els) => blogCard(ctx, els))
  ctx.queue('page-blog', listing.parts.main, (els) => {
    const grid = hasBlogCard(ctx) ? blogCardGrid(els) || cardGrid(els) : null
    if (!grid) ctx.bundle.notes.push('/blog: the post cards were kept as captured (no blog card design or grid found); new posts will not appear there until a loop is added')
    if (grid) replaceElement(els, grid.el, shortcodeWidget('blog-list-loop', '[acv_loop type="acv_blog" template="acv-template://card-blog" limit="100" columns="3" columns_tablet="2" columns_mobile="1" gap="24" orderby="date" order="DESC"]'))
    pageRecord(ctx, '/blog', els, listing, 'Blog')
  })
  const list = rows.slice(0, ctx.LIMIT)
  for (let i = 0; i < list.length; i += 4) {
    await Promise.all(list.slice(i, i + 4).map(async (r) => {
      const live = liveSlugs.includes(r.slug)
      const path = `/blog/${r.slug}`
      let article = { html: r.content || '' }
      let seo = { title: String(r.seo_title || r.meta_title || r.title || '').replace(/(\s*\|\s*Acadvizen){2,}\s*$/i, ' | Acadvizen'), description: r.seo_description || r.meta_description || r.description || r.excerpt || '' }
      // Main's own read time (its count differs from WordPress's); kept until the article is edited.
      let minutes = 0
      if (live) {
        article = await readArticle(ctx, browser, path).catch(() => ({ html: r.content || '' }))
        const html = await (await fetch(mainOwn(`${MAIN}${path}`))).text()
        seo = ctx.headSeo(html, path)
        minutes = Number((html.match(/>(\d+)(?:<!-- -->)?\s*(?:<!-- -->)?min read</i) || [])[1] || 0)
      }
      const image = r.featured_image || r.image || r.og_image_url || r.og_image
      bundle.records.push({
        key: `blog-${r.slug}`,
        post_type: 'acv_blog',
        title: r.title,
        slug: r.slug,
        status: live ? 'publish' : 'draft',
        content: articleContent(ctx, article.html || r.content),
        // Main shows the description (article intro and blog cards), falling back to the excerpt.
        excerpt: r.description || r.excerpt || '',
        date: r.published_at || r.created_at,
        target: 'main',
        main_path: path,
        replace: true,
        featured_media: image ? ctx.media(image, r.title).url.replace('acv-media://', '') : '',
        meta: { _acv_author_name: r.author || '', ...(minutes ? { _acv_reading_minutes: String(minutes) } : {}) },
        terms: { acv_blog_category: [...new Set([...(r.categories || []), ...(r.tags || [])].map(String).filter(Boolean))] },
        seo,
      })
    }))
    if (i % 20 === 0) log(`blogs: ${Math.min(i + 4, list.length)}/${list.length}`)
  }
  for (const name of new Set(bundle.records.filter((r) => r.post_type === 'acv_blog').flatMap((r) => r.terms.acv_blog_category))) {
    bundle.terms.push({ taxonomy: 'acv_blog_category', name })
  }
}

const SHARE = [[/linkedin/i, 'share_linkedin'], [/wa\.me|whatsapp/i, 'share_whatsapp'], [/facebook/i, 'share_facebook'], [/twitter|x\.com/i, 'share_x']]

export function blogTemplate(ctx, elements, sample, article) {
  if (process.env.ACV_DUMP) fs.writeFileSync(`${process.env.ACV_DUMP}/blog-template-raw.json`, JSON.stringify({ elements, article }))
  if (sample) {
    replaceText(elements, (article.title || sample.title).trim(), '[acv_field name="title"]')
    const intro = sample.description || sample.excerpt
    if (intro) replaceText(elements, intro.trim(), '[acv_field name="excerpt"]')
  }
  walk(elements, (el) => {
    const s = el.settings || {}
    const text = widgetText(el)
    if (/^\d+\s*MIN READ$/i.test(text)) for (const k of ['editor', 'title']) if (s[k]) s[k] = s[k].replace(/\d+(\s*MIN READ)/i, '[acv_field name="reading_time"]$1')
    if (el.widgetType === 'image') s.image = { url: '#acv-field-image_url', id: '' }
    if (typeof s.editor === 'string') {
      s.editor = s.editor.replace(/href="([^"]*)"/g, (m, h) => {
        const hit = SHARE.find(([re]) => re.test(h))
        return hit ? `href="#acv-field-${hit[1]}"` : m
      })
    }
    if (s.link && s.link.url) {
      const hit = SHARE.find(([re]) => re.test(s.link.url))
      if (hit) s.link = { ...s.link, url: `#acv-field-${hit[1]}` }
    }
  })
  // The article body: the smallest container holding most of the article's paragraphs. (Matching
  // the first words alone can pick the table of contents, which repeats the first heading.)
  const paragraphs = [...article.html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()).filter((t) => t.length > 40).map((t) => t.slice(0, 40))
  const holdsArticle = (el) => {
    const text = textsOf(el).join(' ').replace(/\s+/g, ' ')
    return paragraphs.length > 0 && paragraphs.filter((p) => text.includes(p)).length >= Math.ceil(paragraphs.length * 0.6)
  }
  const body = findDeepestContainer(elements, holdsArticle)
  if (body) {
    replaceElement(elements, body.el, { id: elementId('blog-body'), elType: 'widget', widgetType: 'text-editor', settings: { editor: '[acv_field name="content"]', _css_classes: 'acv-prose' }, elements: [], isInner: false })
  } else {
    ctx.bundle.notes.push('blog design: article body not found')
  }
  // The innermost box starting with the "Table of Contents" heading: outer wrappers start with the
  // same text but also hold the article.
  const toc = findDeepestContainer(elements, (el) => textsOf(el)[0] === 'Table of Contents')
  if (toc) {
    const list = toc.el.elements.find((e) => e.elType === 'container')
    if (list) replaceElement(elements, list, shortcodeWidget('blog-toc', '[acv_toc]'))
  }
  const related = findDeepestContainer(elements, (el) => textsOf(el)[0] === 'Related Blogs')
  if (related) related.el.elements.push(shortcodeWidget('blog-related', '[acv_loop type="acv_blog" template="acv-template://card-blog" limit="3" columns="3" columns_tablet="2" columns_mobile="1" gap="20" orderby="date" order="DESC"]'))
  ctx.bundle.templates.push({ key: 'design-blog', post_type: 'elementor_library', elementor_template_type: 'page', title: 'Main — Blog post design', target: 'main', elementor_data: elements })
  ctx.bundle.settings.design_templates.acv_blog = 'design-blog'
}

/** The PHP date format that writes a date the way a captured card does ("Oct 8, 2026", "8 OCT 2026"). */
export function dateFormatOf(text = '') {
  const t = String(text).trim()
  if (/^[A-Za-z]{3} \d{1,2}, \d{4}$/.test(t)) return 'M j, Y'
  if (/^[A-Za-z]{4,} \d{1,2}, \d{4}$/.test(t)) return 'F j, Y'
  if (/^\d{1,2} [A-Za-z]{4,} \d{4}$/.test(t)) return 'j F Y'
  return 'j M Y'
}

function blogCard(ctx, elements) {
  const grid = blogCardGrid(elements) || cardGrid(elements)
  const card = grid && grid.el.elements[0]
  if (!card) {
    ctx.bundle.notes.push('blog card: listing grid not found')
    return
  }
  blogCardTemplate(ctx, card, 'card-blog', 'Main — Blog card')
}

/** A captured post card made into a loop card design (date, title, summary, picture, link as fields). */
function blogCardTemplate(ctx, card, key, title) {
  const texts = textsOf(card)
  const dateText = texts.find((t) => /\d{4}$/.test(t) && t.length < 20)
  if (dateText) replaceText([card], dateText, `[acv_field name="date" format="${dateFormatOf(dateText)}"]`)
  const rest = texts.filter((t) => t !== dateText && t.length > 12).sort((a, b) => b.length - a.length)
  if (rest[0]) replaceText([card], rest[0], '[acv_field name="excerpt"]')
  if (rest[1]) replaceText([card], rest[1], '[acv_field name="title"]')
  walk([card], (el) => {
    if (el.widgetType === 'image') el.settings.image = { url: '#acv-field-image_url', id: '' }
    if (el.settings && el.settings.link && /\/blog\//.test(el.settings.link.url || '')) el.settings.link = { ...el.settings.link, url: '#acv-field-url' }
    if (el.settings && typeof el.settings.editor === 'string') el.settings.editor = el.settings.editor.replace(/href="\/blog\/[^"]+"/g, 'href="#acv-field-url"')
  })
  if (card.settings.link) card.settings.link = { ...card.settings.link, url: '#acv-field-url' }
  delete card.settings.width
  card.isInner = false
  ctx.bundle.templates.push({ key, post_type: 'elementor_library', elementor_template_type: 'section', title, target: 'main', elementor_data: [card] })
}

/* Pages, service/location pages and courses -------------------------------------------------- */

/** Blocks hidden on the page (tabs, collapsed panels) whose text is not in the converted design. */
export function lostBlocks(hidden = [], elements = []) {
  const json = JSON.stringify(elements)
  return hidden.filter((text) => !json.includes(JSON.stringify(text.slice(0, 40)).slice(1, -1)))
}

export function pageRecord(ctx, path, elements, captured, title) {
  const lost = lostBlocks(captured.hidden, elements)
  // Never silent. Blocks hidden at every width are switched off on the Main page itself (visitors do
  // not see them), so leaving them out matches the live page. Blocks shown at some widths or after a
  // click are a real gap, listed for a person to rebuild.
  const off = lost.filter((text) => (captured.hiddenEverywhere || []).includes(text))
  const gaps = lost.filter((text) => !off.includes(text))
  if (off.length) ctx.bundle.notes.push(`${path}: ${off.length} block(s) switched off on the Main page (hidden at every width) were not converted, matching what visitors see (e.g. "${off[0]}"); add them in Elementor only if they should be shown`)
  if (gaps.length) ctx.bundle.notes.push(`${path}: ${gaps.length} block(s) shown only at some widths or after a click were NOT converted; rebuild them in Elementor (e.g. "${gaps[0]}")`)
  const slug = path === '/' ? 'main-home' : `main-${path.replace(/^\//, '').replace(/\//g, '-')}`
  ctx.bundle.records.push({
    key: `page-${slug}`,
    post_type: 'page',
    title: `${title || captured.seo.title || path} (Main)`,
    slug,
    target: 'main',
    main_path: path === '/' ? '' : path,
    homepage: path === '/',
    replace: true,
    elementor_data: elements,
    elementor_template_type: 'wp-page',
    page_settings: { acv_publish_target: 'main' },
    page_template: 'elementor_header_footer',
    seo: ctx.seoFrom(captured, path),
  })
}

async function sitemapPaths(ctx) {
  const xml = await (await fetch(`${ctx.MAIN}/sitemap.xml`)).text()
  return [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname.replace(/\/$/, '') || '/'))]
}

/**
 * The homepage's "Quick Registration" popup (src/legacy/pages/HomePage.jsx: opens after 90 seconds;
 * texts from home_sections.registration_popup) as an Elementor Pro popup shown on the Main homepage.
 * Its form is [acv_lead_form] with the popup's fields, sent like Main's own "Quick Registration"
 * lead forms (form_type registration, source home-popup).
 */
async function homeRegistrationPopup(ctx) {
  const row = (await ctx.supabase('home_sections', 'select=title,subtitle,body,cta_json&section_key=eq.registration_popup&is_active=eq.true'))[0] || {}
  const title = row.title || 'Quick Registration'
  const subtitle = row.subtitle || 'Reserve your spot in under 60 seconds.'
  const consent = String(row.body || 'I agree to the Privacy Policy and allow Acadvizen to contact me.').replace(/["[\]]/g, '')
  const submit = String((row.cta_json && row.cta_json.submit_label) || 'Register Now').replace(/["[\]]/g, '')
  const text = (seed, settings) => ({ id: elementId(seed), elType: 'widget', widgetType: 'heading', settings, elements: [], isInner: false })
  ctx.bundle.templates.push({
    key: 'popup-home-registration',
    title: 'Quick Registration popup (Main homepage)',
    post_type: 'elementor_library',
    elementor_template_type: 'popup',
    target: 'main',
    conditions: ['include/singular/page/acv-record-id://page-main-home'],
    popup_display: { triggers: { page_load: 'yes', page_load_delay: 90 }, timing: {} },
    page_settings: { width: { unit: 'px', size: 448 }, width_mobile: { unit: '%', size: 92 }, height_type: 'auto', content_position: 'top', background_background: 'classic', background_color: '#06182B', border_radius: { unit: 'px', top: '24', right: '24', bottom: '24', left: '24', isLinked: true }, border_border: 'solid', border_width: { unit: 'px', top: '1', right: '1', bottom: '1', left: '1', isLinked: true }, border_color: '#FFFFFF1A', overlay_background_background: 'classic', overlay_background_color: '#020617B3', close_button_vertical: { unit: '%', size: 3 }, close_button_horizontal: { unit: '%', size: 3 }, close_button_color: '#94A3B8', entrance_animation: 'fadeIn' },
    elementor_data: [{
      id: elementId('popup-home-registration'), elType: 'container', isInner: false,
      settings: { content_width: 'full', flex_direction: 'column', flex_gap: { unit: 'px', column: '8', row: '8', isLinked: true, size: 8 }, padding: { unit: 'px', top: '24', right: '24', bottom: '24', left: '24', isLinked: true } },
      elements: [
        text('popup-home-registration-title', { title, header_size: 'h3', title_color: '#F8FAFC', typography_typography: 'custom', typography_font_family: 'Inter', typography_font_size: { unit: 'px', size: 20 }, typography_font_weight: '600' }),
        text('popup-home-registration-subtitle', { title: subtitle, header_size: 'p', title_color: '#94A3B8', typography_typography: 'custom', typography_font_family: 'Inter', typography_font_size: { unit: 'px', size: 14 }, typography_font_weight: '400' }),
        shortcodeWidget('popup-home-registration-form', `[acv_lead_form form_type="registration" source="home-popup" page_slug="/" require_all="yes" modes="online:Online,classroom:Classroom" consent="${consent}" submit="${submit}" name_label="Full Name" email_label="Email" phone_label="Mobile Number (+91)" success="Registered! We will contact you soon."]`, { _margin: { unit: 'px', top: '12', right: '0', bottom: '0', left: '0', isLinked: false } }),
      ],
    }],
  })
}

/**
 * /tools: the listing card (logo, name, description, category, "Open") becomes the "Main — Tool
 * listing card" template; the grid becomes [acv_loop] in Main's order (newest first), and Main's
 * search box and category list become the loop's working filter (same choices as ToolsPage.jsx).
 */
function toolsListing(ctx, els) {
  const grid = cardGrid(els)
  if (!grid) {
    ctx.bundle.notes.push('tools listing: card grid not found')
    return
  }
  // Measured on the card with the longest description (never a test record): its text column fills
  // the card as on Main, where a short card's column would be captured at that text's own width.
  const real = grid.el.elements.filter((c) => !/local e2e/i.test(textsOf(c).join(' ')))
  const longest = real.slice(0, 9).reduce((a, c) => ((textsOf(c)[1] || '').length > (textsOf(a)[1] || '').length ? c : a), real[0] || grid.el.elements[0])
  const card = JSON.parse(JSON.stringify(longest))
  const texts = textsOf(card)
  if (texts[0]) replaceText([card], texts[0], '[acv_field name="title"]')
  if (texts[1]) replaceText([card], texts[1], '[acv_field name="excerpt"]')
  if (texts[2]) replaceText([card], texts[2], '[acv_field name="category"]')
  walk([card], (el) => { if (el.widgetType === 'image') el.settings.image = { url: '#acv-field-image_url', id: '' } })
  card.settings.html_tag = 'a'
  card.settings.link = { url: '#acv-field-url', is_external: '', nofollow: '' }
  delete card.settings.width
  card.isInner = false
  ctx.bundle.templates.push({ key: 'card-tool-list', post_type: 'elementor_library', elementor_template_type: 'section', title: 'Main — Tool listing card', target: 'main', elementor_data: [card] })
  // Main's own search panel (a React control) is replaced by the loop's filter above the grid; its
  // tip line ("Tip: Hover cards…") is kept beside the count.
  const panel = findDeepestContainer(els, (el) => { const t = textsOf(el).join(' '); return /Showing\s*\d+\s*of\s*\d+/i.test(t) && JSON.stringify(el).includes('Search tools') })
  const note = panel ? (textsOf(panel.el).find((t) => /^tip\b/i.test(t.trim())) || '').trim().replace(/["\]]/g, '') : ''
  replaceElement(els, grid.el, shortcodeWidget('tools-list-loop', `[acv_loop type="acv_tool" template="acv-template://card-tool-list" limit="100" columns="3" columns_tablet="2" columns_mobile="1" gap="24" orderby="date:DESC menu_order:ASC" exclude_current="no" filter="yes" filter_first="Gen AI" filter_groups="Digital Marketing=!Gen AI" filter_placeholder="Search tools..." filter_all="All Categories" filter_count="Showing %1$s of %2$s"${note ? ` filter_note="${note}"` : ''}]`))
  if (panel) replaceElement(els, panel.el, [])
  else ctx.bundle.notes.push('tools listing: search panel not found (left as is)')
}

/** The lead form_type the Main Website records for a page (same prefixes as lib/cmsServer.js). */
function formTypeFor(path) {
  if (path.startsWith('/digital-marketing-course-in-')) return 'city_enquiry'
  if (path.startsWith('/digital-marketing-courses-')) return 'location_enquiry'
  if (path.startsWith('/digital-marketing-course-')) return 'city_course_enquiry'
  return 'inquiry'
}

/** A route drawn by the shared service/location layout: breadcrumb, one heading and text. */
function isServiceLayout(html) {
  const main = (html.match(/<main[\s\S]*?<\/main>/) || [''])[0]
  // The page title may be an h1 or an h2; a service page has exactly one heading and no form.
  const headings = (main.match(/<h[12][\s>]/g) || []).length
  return main.length > 0 && headings === 1 && !/<h3/.test(main) && (main.match(/<section/g) || []).length <= 2 && !/<form/.test(main)
}

const firstHeading = (html) => ((html.match(/<h([12])[^>]*>([\s\S]*?)<\/h\1>/) || [])[2] || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim()

/**
 * Routes the migration plan keeps on the Main Website: application lists and detail pages drawn from
 * Main's data (courses, tools and blog lists, placement, resources, companies, internships) and the
 * programmatic city pages. See docs/cms-implementation/MAIN-MIGRATION-PLAN.md section 2.
 */
export const APP_ROUTE = /^\/(courses|tools|blog|placement|resources|companies|internships)(\/|$)|^\/digital-marketing-courses?-[a-z0-9-]+$/

export async function routeFamilies(ctx, browser) {
  const { MAIN, bundle, log, ONLY } = ctx
  const paths = (await sitemapPaths(ctx)).filter((p) => !p.startsWith('/blog') && !p.startsWith('/tools/') && (!ctx.PATHS || ctx.PATHS.includes(p)))
  const cmsPages = await ctx.supabase('pages', 'select=slug,title,content,status')
  const services = []
  const statics = []
  const keptOnMain = []
  const areaPaths = []
  for (const p of paths) {
    const r = await fetch(mainOwn(`${MAIN}${p}`), { redirect: 'manual' })
    if (r.status >= 300 && r.status < 400) {
      bundle.notes.push(`route ${p} redirects to ${r.headers.get('location')} (kept as a Main Website redirect)`)
      continue
    }
    if (r.status !== 200) {
      // Listed in the sitemap but Main has no page of its own there: a WordPress-only page.
      bundle.notes.push(`route ${p}: Main has no page of its own (status ${r.status}); a WordPress page, left as it is`)
      continue
    }
    const html = await r.text()
    // Service/location pages are Page Builder rows (Supabase "pages") drawn by the shared layout.
    // Application routes (e.g. /companies, /resources) can look as sparse before their data loads,
    // so the layout alone does not decide: they keep their own design.
    const isCmsRow = cmsPages.some((x) => `/${x.slug}` === p)
    if (AREA_ROUTE.test(p) || CITY_COURSE_ROUTE.test(p)) { areaPaths.push(p); continue }
    if (!ctx.INCLUDE_APP_ROUTES && APP_ROUTE.test(p)) keptOnMain.push(p)
    else if (p !== '/' && !p.startsWith('/courses/') && isCmsRow && isServiceLayout(html)) services.push({ path: p, html })
    else statics.push(p)
  }
  if (areaPaths.length) bundle.notes.push(`drawn by a shared design with the page name bound (--only areas), not converted as individual pages: ${areaPaths.join(' ')}`)
  if (keptOnMain.length) bundle.notes.push(`kept on the Main Website (application and data-driven routes; --include-app-routes converts them): ${keptOnMain.join(' ')}`)
  log(`routes: ${services.length} service/location pages, ${statics.length} individual pages`)
  bundle.notes.push(`individual pages: ${statics.join(' ')}`)
  if (ONLY.includes('services') && services.length) {
    const sample = services.find((s) => s.path === '/seo-course-in-jayanagar') || services[0]
    const captured = await ctx.captureRoute(browser, `${MAIN}${sample.path}`, ['main'])
    const row = cmsPages.find((x) => `/${x.slug}` === sample.path)
    ctx.queue('design-location', captured.parts.main, (els) => serviceTemplate(ctx, els, firstHeading(sample.html), row, visibleParagraph(sample.html)))
    for (const svc of services.slice(0, ctx.LIMIT)) {
      const row = cmsPages.find((x) => `/${x.slug}` === svc.path)
      const content = row && row.content && row.content.html ? row.content.html : visibleParagraph(svc.html)
      bundle.records.push({
        key: `location-${svc.path.slice(1)}`,
        post_type: 'acv_location',
        title: firstHeading(svc.html) || (row && row.title) || svc.path.slice(1),
        slug: svc.path.slice(1),
        content: articleContent(ctx, content),
        target: 'main',
        main_path: svc.path,
        replace: true,
        seo: ctx.headSeo(svc.html, svc.path),
      })
    }
  }
  if (ONLY.includes('pages')) {
    // Page Builder lead-form sections: keep each form's form_type, source and success message.
    const leadForms = new Map((await ctx.supabase('sections', 'select=page_slug,content_json&section_type=eq.lead_form&visibility=eq.true')).filter((s) => s.page_slug).map((s) => {
      const c = s.content_json || {}
      return [s.page_slug, { form_type: c.form_type || 'inquiry', source: c.source || 'website', success: c.success_message || '' }]
    }))
    for (const p of statics.slice(0, ctx.LIMIT)) {
      log(`page ${p}`)
      const captured = await ctx.captureRoute(browser, `${MAIN}${p}`, ['main'])
      if (captured.status !== 200) {
        bundle.notes.push(`page ${p}: Main answered ${captured.status}; not converted`)
        continue
      }
      if (p.startsWith('/courses/')) {
        const slug = p.split('/').pop()
        ctx.queue(`course-${slug}`, captured.parts.main, (els) => bundle.records.push({ key: `course-${slug}`, post_type: 'acv_course', title: (captured.seo.title || slug).split('|')[0].trim(), slug, target: 'main', main_path: p, replace: true, elementor_data: els, elementor_template_type: 'wp-post', page_template: 'elementor_header_footer', seo: ctx.seoFrom(captured, p) }), { formType: 'course_enquiry' })
        continue
      }
      if (p === '/') await homeRegistrationPopup(ctx)
      ctx.queue(`page-${p}`, captured.parts.main, (els) => {
        if (p === '/tools') toolsListing(ctx, els)
        if (p === '/') {
          const fromBlog = findContainer(els, (el) => el.settings.html_tag === 'section' && textsOf(el).some((t) => /^From the Blog$/i.test(t)))
          // The homepage card has its own look ("Oct 8, 2026", "Read article"): its own card design.
          const grid = fromBlog ? blogCardGrid(fromBlog.el.elements) : null
          if (fromBlog && !grid) ctx.bundle.notes.push('/: the "From the Blog" cards were kept as captured (no card grid found); new posts will not appear there until a loop is added')
          if (grid) {
            blogCardTemplate(ctx, structuredClone(grid.el.elements[0]), 'card-blog-home', 'Main — Homepage blog card')
            // As many newest posts as Main shows (six on 21 Oct 2026; a fixed four left two out), in its columns.
            const gs = grid.el.settings || {}
            const cols = (v, d) => (v && Number(v.size) > 0 ? Number(v.size) : d)
            replaceElement(els, grid.el, shortcodeWidget('home-blog-loop', `[acv_loop type="acv_blog" template="acv-template://card-blog-home" limit="${grid.el.elements.length}" columns="${cols(gs.grid_columns_grid, 4)}" columns_tablet="${cols(gs.grid_columns_grid_tablet, 2)}" columns_mobile="${cols(gs.grid_columns_grid_mobile, 1)}" gap="16" orderby="date" order="DESC"]`))
          }
        }
        pageRecord(ctx, p, els, captured, (captured.seo.title || p).split('|')[0].trim())
      }, { formType: leadForms.get(p.slice(1)) || formTypeFor(p) })
    }
  }
}

// The paragraph Main shows under a service/location page's heading; the paragraph can sit in its own
// wrapper (<h2>…</h2><div><p>…</p></div>).
export function visibleParagraph(html) {
  return (String(html).match(/<h[12][^>]*>[\s\S]*?<\/h[12]>\s*(?:<div[^>]*>\s*)*<p[^>]*>([\s\S]*?)<\/p>/) || [])[1] || ''
}

function serviceTemplate(ctx, elements, heading, row, visible = '') {
  if (heading) replaceText(elements, heading, '[acv_field name="title"]')
  const text = (row && row.content && row.content.html ? String(row.content.html) : visible).replace(/<[^>]+>/g, '').trim()
  let replaced = false
  walk(elements, (el) => {
    if (!replaced && el.widgetType === 'text-editor' && text && widgetText(el).startsWith(text.slice(0, 40))) {
      el.settings.editor = '[acv_field name="content"]'
      el.settings._css_classes = 'acv-prose'
      replaced = true
    }
  })
  if (!replaced) ctx.bundle.notes.push('service design: description text not found')
  ctx.bundle.templates.push({ key: 'design-location', post_type: 'elementor_library', elementor_template_type: 'page', title: 'Main — Location & service page design', target: 'main', elementor_data: elements })
  ctx.bundle.settings.design_templates.acv_location = 'design-location'
}

/* Area and city course pages (data-generated) -------------------------------------------------- */

/** /digital-marketing-courses-<area>: drawn by Main from a "locations" row (LocationPageRenderer). */
export const AREA_ROUTE = /^\/digital-marketing-courses-[a-z0-9-]+$/
/** /digital-marketing-course-<city> (not "-in-"): drawn by Main from a "cities" row (CityCoursePageRenderer). */
export const CITY_COURSE_ROUTE = /^\/digital-marketing-course-(?!in-)[a-z0-9-]+$/

/** The area or city name as Main writes it on the page, from its address (formatLocation/formatCity). */
export function nameFromSlug(slug) {
  return String(slug || '').split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

/**
 * The page's own name in the design's visible text becomes the record's name field; text inside HTML
 * tags (links, attributes) is never touched.
 */
export function bindName(elements, name, field = '[acv_field name="title"]') {
  if (!name) return 0
  let n = 0
  // Text inside a link to another page (a blog post's title under "Related resources") belongs to that
  // page and is never bound, nor is anything in an address.
  const swap = (html) => {
    let inLink = 0
    return String(html).split(/(<[^>]+>)/).map((part) => {
      if (/^<a[\s>]/i.test(part)) { inLink++; return part }
      if (/^<\/a>/i.test(part)) { inLink = Math.max(0, inLink - 1); return part }
      return part.startsWith('<') || inLink ? part : part.split(name).join(field)
    }).join('')
  }
  const SKIP = /^(link|url|external_url|hosted_url|image|background_image|_css_classes|custom_css|__globals__|_id)$/
  const bindValue = (value, key = '') => {
    if (SKIP.test(key)) return value
    if (typeof value === 'string') { if (!value.includes(name)) return value; n++; return swap(value) }
    if (Array.isArray(value)) return value.map((v) => bindValue(v))
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, bindValue(v, k)]))
    return value
  }
  const linked = (el) => Boolean(el.settings && el.settings.link && el.settings.link.url)
  const visit = (els, insideLink) => {
    for (const el of els) {
      const here = insideLink || linked(el)
      // Text settings only (titles, editor text, accordion/tab items), never in or under a link to elsewhere.
      if (!here && el.settings) el.settings = Object.fromEntries(Object.entries(el.settings).map(([k, v]) => [k, /^(title|editor|text|items|tabs|carousel_items|slides)$/.test(k) || (Array.isArray(v) && k.endsWith('_items')) ? bindValue(v, k) : v]))
      visit(el.elements || [], here)
    }
  }
  visit(elements, false)
  return n
}

/**
 * Text that differs per page beyond its name, read from each live page so every record keeps its own:
 * the introduction under the heading (a location row's description) and the "Nearby areas in …" title
 * (Main writes "the city" or "Bangalore" depending on the row).
 */
export function areaTexts(html) {
  const main = (String(html).match(/<main[\s\S]*?<\/main>/) || [String(html)])[0]
  const text = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim()
  const intro = text((main.match(/<h1[^>]*>[\s\S]*?<\/h1>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/) || [])[1])
  const nearby = text((main.match(/>\s*(Nearby areas in [^<]*)</) || [])[1])
  // The heading: "Digital Marketing Courses in <area>" unless the row has its own ("… near MG Road").
  const heading = text((main.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1])
  return { intro, nearby, heading }
}

/** The design widget showing exactly this text becomes the given field. */
function bindExactText(elements, text, field) {
  if (!text) return false
  let done = false
  walk(elements, (el) => {
    if (done || el.elType !== 'widget') return
    if (widgetText(el) === text) {
      const s = el.settings
      for (const key of ['title', 'editor', 'text']) if (typeof s[key] === 'string') { s[key] = key === 'editor' ? `<p>${field}</p>` : field; done = true; break }
    }
  })
  return done
}

/**
 * "Nearby areas" (Main: the other active locations of the same city, by order_index, at most six) as a
 * loop of the records drawn by the same design and in the same city, in the same order. The list's
 * first link is the card; its text is the record's name, its address the record's.
 */
/** The gap between the items of a converted list container (its flex or grid gap), in px. */
function gapOf(el) {
  const g = (el.settings && (el.settings.flex_gap || el.settings.grid_gaps)) || {}
  return Number(g.column || g.size) || 8
}

function nearbyAreasLoop(ctx, els, siblingNames, designKey) {
  const list = findDeepestContainer(els, (el) => siblingNames.filter((name) => textsOf(el).includes(name)).length >= Math.min(3, siblingNames.length))
  if (!list || !list.el.elements || !list.el.elements.length) {
    ctx.bundle.notes.push(`${designKey}: "Nearby areas" list not found; its links stay as captured`)
    return false
  }
  const card = JSON.parse(JSON.stringify(list.el.elements[0]))
  const first = textsOf(card)[0] || ''
  if (first) replaceText([card], first, '[acv_field name="name"]')
  walk([card], (el) => {
    const s = el.settings || {}
    if (s.link && /^\/digital-marketing-courses-/.test(s.link.url || '')) s.link = { ...s.link, url: '#acv-field-url' }
    if (typeof s.editor === 'string') s.editor = s.editor.replace(/href="\/digital-marketing-courses-[^"]*"/g, 'href="#acv-field-url"')
  })
  card.isInner = false
  const cardKey = `${designKey}-nearby-card`
  ctx.bundle.templates.push({ key: cardKey, post_type: 'elementor_library', elementor_template_type: 'section', title: 'Main — Nearby area link', target: 'main', elementor_data: [card] })
  // The loop takes over the list's layout: its grid columns per device (Main: three cards a row on
  // desktop), or a wrapping row; the list's own box becomes a plain full-width box around the loop.
  const ls = list.el.settings || {}
  const grid = ls.container_type === 'grid'
  const cols = (v, d) => (v && Number(v.size) > 0 ? Number(v.size) : d)
  const layout = grid ? `columns="${cols(ls.grid_columns_grid, 3)}" columns_tablet="${cols(ls.grid_columns_grid_tablet, 2)}" columns_mobile="${cols(ls.grid_columns_grid_mobile, 1)}"` : 'layout="row"'
  if (grid) {
    list.el.settings = Object.fromEntries(Object.entries(ls).filter(([k]) => !/^grid_|^container_type/.test(k)))
    list.el.settings.container_type = 'flex'
    list.el.settings.flex_direction = 'column'
  }
  list.el.elements = [shortcodeWidget(`${designKey}:nearby`, `[acv_loop type="acv_location" template="acv-template://${cardKey}" limit="6" ${layout} gap="${gapOf({ settings: ls })}" same="_acv_location_city_id" same_design="yes" exclude_current="yes" orderby="menu_order title" order="ASC" link="no"]`)]
  return true
}

/** The area addresses a live page lists under "Nearby areas", in order (its own section only). */
export function nearbyOrder(html) {
  const at = String(html).search(/>\s*Nearby areas/i)
  if (at < 0) return []
  const section = html.slice(at, (html.indexOf('</section>', at) + 1 || html.length + 1) - 1)
  return [...new Set([...section.matchAll(/href="\/digital-marketing-courses-([a-z0-9-]+)"/g)].map((m) => m[1]))]
}

/**
 * One order for all areas, consistent with every live "Nearby areas" list (each is a slice of Main's
 * order_index order, which the content API does not expose): each list says which area comes before
 * which; areas never seen keep the end, by name.
 */
export function mergeOrder(lists, all, limit = 6) {
  const before = new Map(all.map((s) => [s, new Set()]))
  for (const entry of lists) {
    // A list is either the addresses alone, or { list, candidates }: the addresses that page could
    // list (Main: the other active locations of its city, or all others without a city).
    const list = Array.isArray(entry) ? entry : entry.list
    for (let i = 1; i < list.length; i++) if (before.has(list[i]) && before.has(list[i - 1])) before.get(list[i]).add(list[i - 1])
    // A full list (the first `limit`) says every candidate it leaves out comes after its last one.
    if (!Array.isArray(entry) && list.length === limit) for (const s of entry.candidates) if (!list.includes(s) && before.has(s) && before.has(list[limit - 1])) before.get(s).add(list[limit - 1])
  }
  const out = []
  const left = new Set(all)
  while (left.size) {
    const ready = [...left].filter((s) => [...before.get(s)].every((p) => !left.has(p))).sort()
    const next = ready.length ? ready[0] : [...left].sort()[0] // a cycle (should not happen): by name
    out.push(next); left.delete(next)
  }
  return out
}

export async function areaFamily(ctx, browser) {
  const { MAIN, bundle, log } = ctx
  const sitemap = await sitemapPaths(ctx)
  const families = [
    { key: 'design-area', title: 'Main — Area course page design', re: AREA_ROUTE, prefix: '/digital-marketing-courses-', table: 'locations', sample: 'jayanagar' },
    { key: 'design-city-course', title: 'Main — City course page design', re: CITY_COURSE_ROUTE, prefix: '/digital-marketing-course-', table: 'cities', sample: 'bangalore' },
  ]
  for (const f of families) {
    const paths = sitemap.filter((p) => f.re.test(p) && (!ctx.PATHS || ctx.PATHS.includes(p)))
    if (!paths.length) continue
    const rows = (await ctx.supabase(f.table, 'select=*')).filter((r) => r.is_active !== false)
    const bySlug = new Map(rows.map((r) => [r.slug, r]))
    const samplePath = paths.find((p) => p === `${f.prefix}${f.sample}`) || paths[0]
    const sampleSlug = samplePath.slice(f.prefix.length)
    const sampleRow = bySlug.get(sampleSlug) || {}
    // The other locations Main lists on the sample page, as it chooses them.
    const siblings = rows.filter((r) => r.slug !== sampleSlug && (!sampleRow.city_id || r.city_id === sampleRow.city_id)).sort((a, b) => (Number(a.order_index) || 0) - (Number(b.order_index) || 0)).slice(0, 6).map((r) => r.name)
    log(`${f.key}: ${paths.length} pages from "${f.table}" (${rows.length} rows); sample ${samplePath}`)
    const captured = await ctx.captureRoute(browser, `${MAIN}${samplePath}`, ['main'])
    ctx.queue(f.key, captured.parts.main, (els) => {
      if (f.table === 'locations' && siblings.length) nearbyAreasLoop(ctx, els, siblings, f.key)
      // Per-page texts first (they contain the name too), then the name everywhere else.
      const sampleTexts = areaTexts((pages.find((x) => x.p === samplePath) || {}).html || '')
      if (sampleTexts.intro && !bindExactText(els, sampleTexts.intro, '[acv_field name="intro"]')) bundle.notes.push(`${f.key}: introduction "${sampleTexts.intro.slice(0, 50)}" not found in the design`)
      if (sampleTexts.heading && !bindExactText(els, sampleTexts.heading, '[acv_field name="heading"]')) bundle.notes.push(`${f.key}: heading "${sampleTexts.heading}" not found in the design`)
      if (sampleTexts.nearby && !bindExactText(els, sampleTexts.nearby, '[acv_field name="nearby_title"]')) bundle.notes.push(`${f.key}: "${sampleTexts.nearby}" not found in the design`)
      const bound = bindName(els, nameFromSlug(sampleSlug))
      if (!bound) bundle.notes.push(`${f.key}: the page name "${nameFromSlug(sampleSlug)}" was not found in the design`)
      bundle.templates.push({ key: f.key, post_type: 'elementor_library', elementor_template_type: 'page', title: f.title, target: 'main', elementor_data: els })
    })
    const pages = []
    for (const p of paths) pages.push({ p, html: await (await fetch(mainOwn(`${MAIN}${p}`))).text() })
    // Main orders nearby areas by order_index; the order is read back from the live pages themselves.
    const slugs = paths.map((p) => p.slice(f.prefix.length))
    const cityOf = (s) => String((bySlug.get(s) || {}).city_id || '')
    const order = f.table === 'locations'
      ? mergeOrder(pages.map((x) => { const self = x.p.slice(f.prefix.length); return { list: nearbyOrder(x.html), candidates: slugs.filter((s) => s !== self && (!cityOf(self) || cityOf(s) === cityOf(self))) } }), slugs)
      : []
    if (order.length) log(`${f.key}: nearby order ${order.join(' ')}`)
    for (const { p, html } of pages) {
      const slug = p.slice(f.prefix.length)
      const row = bySlug.get(slug) || {}
      bundle.records.push({
        key: `area-${p.slice(1)}`,
        post_type: 'acv_location',
        title: nameFromSlug(slug),
        slug: p.slice(1),
        content: '',
        order: Number.isFinite(Number(row.order_index)) && row.order_index !== null && row.order_index !== undefined ? Number(row.order_index) : Math.max(0, order.indexOf(slug)),
        target: 'main',
        main_path: p,
        replace: true,
        seo: ctx.headSeo(html, p),
        meta: {
          _acv_design_template: `acv-template://${f.key}`,
          _acv_location_name: String(row.name || nameFromSlug(slug)),
          _acv_location_intro: areaTexts(html).intro,
          _acv_location_heading: areaTexts(html).heading,
          ...(areaTexts(html).nearby ? { _acv_location_nearby_title: areaTexts(html).nearby } : {}),
          ...(row.city_id ? { _acv_location_city_id: String(row.city_id) } : {}),
        },
      })
    }
    if (paths.some((p) => !bySlug.has(p.slice(f.prefix.length)))) bundle.notes.push(`${f.key}: ${paths.filter((p) => !bySlug.has(p.slice(f.prefix.length))).join(' ')} have no "${f.table}" row (Main draws them from their address alone)`)
  }
}
