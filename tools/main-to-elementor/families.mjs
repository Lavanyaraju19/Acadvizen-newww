/**
 * Content families migrated from the live Main Website: blogs, service/location pages, individual
 * pages (homepage, about, contact, …) and courses. Each function receives the builder context:
 *   { MAIN, LIMIT, ONLY, bundle, queue, media, link, log, supabase, captureRoute, seoFrom, headSeo }
 */
import fs from 'node:fs'
import { elementId } from './convert.mjs'
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

export async function blogFamily(ctx, browser) {
  const { MAIN, bundle, log } = ctx
  const listHtml = await (await fetch(`${MAIN}/blog`)).text()
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
    const grid = cardGrid(els)
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
        const html = await (await fetch(`${MAIN}${path}`)).text()
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

function blogCard(ctx, elements) {
  const grid = cardGrid(elements)
  const card = grid && grid.el.elements[0]
  if (!card) {
    ctx.bundle.notes.push('blog card: listing grid not found')
    return
  }
  const texts = textsOf(card)
  const dateText = texts.find((t) => /\d{4}$/.test(t) && t.length < 20)
  if (dateText) replaceText([card], dateText, '[acv_field name="date" format="j M Y"]')
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
  ctx.bundle.templates.push({ key: 'card-blog', post_type: 'elementor_library', elementor_template_type: 'section', title: 'Main — Blog card', target: 'main', elementor_data: [card] })
}

/* Pages, service/location pages and courses -------------------------------------------------- */

export function pageRecord(ctx, path, elements, captured, title) {
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

export async function routeFamilies(ctx, browser) {
  const { MAIN, bundle, log, ONLY } = ctx
  const paths = (await sitemapPaths(ctx)).filter((p) => !p.startsWith('/blog') && !p.startsWith('/tools/'))
  const cmsPages = await ctx.supabase('pages', 'select=slug,title,content,status')
  const services = []
  const statics = []
  for (const p of paths) {
    const r = await fetch(`${MAIN}${p}`, { redirect: 'manual' })
    if (r.status >= 300 && r.status < 400) {
      bundle.notes.push(`route ${p} redirects to ${r.headers.get('location')} (kept as a Main Website redirect)`)
      continue
    }
    const html = await r.text()
    // Service/location pages are Page Builder rows (Supabase "pages") drawn by the shared layout.
    // Application routes (e.g. /companies, /resources) can look as sparse before their data loads,
    // so the layout alone does not decide: they keep their own design.
    const isCmsRow = cmsPages.some((x) => `/${x.slug}` === p)
    if (p !== '/' && !p.startsWith('/courses/') && isCmsRow && isServiceLayout(html)) services.push({ path: p, html })
    else statics.push(p)
  }
  log(`routes: ${services.length} service/location pages, ${statics.length} individual pages`)
  bundle.notes.push(`individual pages: ${statics.join(' ')}`)
  if (ONLY.includes('services') && services.length) {
    const sample = services.find((s) => s.path === '/seo-course-in-jayanagar') || services[0]
    const captured = await ctx.captureRoute(browser, `${MAIN}${sample.path}`, ['main'])
    const row = cmsPages.find((x) => `/${x.slug}` === sample.path)
    ctx.queue('design-location', captured.parts.main, (els) => serviceTemplate(ctx, els, firstHeading(sample.html), row))
    for (const svc of services.slice(0, ctx.LIMIT)) {
      const row = cmsPages.find((x) => `/${x.slug}` === svc.path)
      const content = row && row.content && row.content.html ? row.content.html : ((svc.html.match(/<h[12][\s\S]*?<\/h[12]>\s*<p[^>]*>([\s\S]*?)<\/p>/) || [])[1] || '')
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
          const grid = fromBlog && findContainer(fromBlog.el.elements, (el) => el.settings.container_type === 'grid' || (el.elements || []).length >= 3)
          if (grid) replaceElement(els, grid.el, shortcodeWidget('home-blog-loop', '[acv_loop type="acv_blog" template="acv-template://card-blog" limit="4" columns="4" columns_tablet="2" columns_mobile="1" gap="16" orderby="date" order="DESC"]'))
        }
        pageRecord(ctx, p, els, captured, (captured.seo.title || p).split('|')[0].trim())
      }, { formType: leadForms.get(p.slice(1)) || formTypeFor(p) })
    }
  }
}

function serviceTemplate(ctx, elements, heading, row) {
  if (heading) replaceText(elements, heading, '[acv_field name="title"]')
  const text = row && row.content && row.content.html ? String(row.content.html).replace(/<[^>]+>/g, '').trim() : ''
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
