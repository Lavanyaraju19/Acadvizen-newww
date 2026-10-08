/**
 * Browser-side extraction of a rendered page (run with Playwright's page.evaluate).
 *
 * Walks the DOM below the given roots and returns a tree of nodes with the computed styles the
 * converter needs. Every element gets a stable data-acv-id the first time it is seen, so the same
 * page can be measured again at other viewport widths and matched node by node.
 *
 * Self-contained: page.evaluate serialises this function, so it must not use imports or closures.
 */
export function extractInPage({ roots, viewport }) {
  const STYLE_KEYS = [
    'display', 'position', 'top', 'right', 'bottom', 'left', 'zIndex', 'flexDirection', 'flexWrap',
    'justifyContent', 'alignItems', 'alignSelf', 'flexGrow', 'flexShrink', 'order', 'rowGap', 'columnGap',
    'gridTemplateColumns', 'gridColumnStart', 'gridColumnEnd', 'width', 'height', 'minHeight', 'maxWidth',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginRight', 'marginBottom',
    'marginLeft', 'backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition', 'backgroundRepeat',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderTopStyle', 'borderTopColor',
    'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'borderTopLeftRadius', 'borderTopRightRadius',
    'borderBottomRightRadius', 'borderBottomLeftRadius', 'boxShadow', 'opacity', 'overflowX', 'overflowY',
    'backdropFilter', 'filter', 'transform', 'color', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
    'lineHeight', 'letterSpacing', 'textTransform', 'textAlign', 'textDecorationLine', 'whiteSpace',
    'objectFit', 'objectPosition', 'backgroundClip', 'webkitBackgroundClip', 'webkitTextFillColor', 'webkitLineClamp',
    'mixBlendMode', 'animationName', 'animationDuration', 'animationTimingFunction', 'animationIterationCount',
    'listStyleType', 'cursor', 'visibility', 'boxSizing', 'textShadow', 'outlineStyle', 'aspectRatio',
  ]
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'META', 'LINK', 'HEAD', 'TITLE'])
  // Box styles a loose text run must not copy from the element it sits in.
  const LOOSE_TEXT_BOX = {
    display: 'inline', position: 'static', width: 'auto', height: 'auto', minHeight: '0px', maxWidth: 'none',
    paddingTop: '0px', paddingRight: '0px', paddingBottom: '0px', paddingLeft: '0px', marginTop: '0px', marginRight: '0px', marginBottom: '0px', marginLeft: '0px',
    backgroundColor: 'rgba(0, 0, 0, 0)', backgroundImage: 'none', borderTopWidth: '0px', borderRightWidth: '0px', borderBottomWidth: '0px', borderLeftWidth: '0px',
    borderTopLeftRadius: '0px', borderTopRightRadius: '0px', borderBottomRightRadius: '0px', borderBottomLeftRadius: '0px', boxShadow: 'none',
    backdropFilter: 'none', filter: 'none', transform: 'none', opacity: '1', overflowX: 'visible', overflowY: 'visible', animationName: 'none',
  }
  const INLINE_TAGS = new Set(['A', 'SPAN', 'STRONG', 'B', 'EM', 'I', 'U', 'SMALL', 'SUP', 'SUB', 'CODE', 'MARK', 'BR', 'S', 'ABBR', 'TIME', 'WBR', 'Q', 'CITE', 'DEL', 'INS', 'KBD'])
  const ATOMIC_TAGS = new Set(['IMG', 'SVG', 'PICTURE', 'VIDEO', 'IFRAME', 'CANVAS', 'FORM', 'INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'])
  let next = Number(document.documentElement.dataset.acvNext || 0)

  const idOf = (el) => {
    if (!el.dataset.acvId) el.dataset.acvId = `n${(next += 1)}`
    return el.dataset.acvId
  }
  const styleOf = (el) => {
    const s = getComputedStyle(el)
    const out = {}
    for (const k of STYLE_KEYS) out[k] = s[k]
    return out
  }
  const isHidden = (el, s) => s.display === 'none' || s.visibility === 'hidden' || (el.getClientRects().length === 0 && el.tagName !== 'BR')
  const hasDirectText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
  // An element is "inline content" when everything inside it is text or inline formatting.
  const isInlineOnly = (el) => {
    for (const child of el.children) {
      if (!INLINE_TAGS.has(child.tagName)) return false
      const d = getComputedStyle(child).display
      if (d !== 'inline' && d !== 'contents' && !(child.tagName === 'BR')) {
        // inline-block/flex children with block layout are structure, not formatting - and so is a
        // link or button drawn as a button (its own background or border): it becomes a Button.
        const cs = getComputedStyle(child)
        const drawn = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.backgroundImage !== 'none' || parseFloat(cs.borderTopWidth) > 0
        if ((child.tagName === 'A' || child.tagName === 'BUTTON') && drawn) return false
        if (d.startsWith('inline') && child.children.length === 0) continue
        return false
      }
      if (!isInlineOnly(child)) return false
    }
    return true
  }
  // Inline HTML with only formatting tags kept; differing colours/weights become inline styles.
  const cleanInlineHtml = (el) => {
    const base = getComputedStyle(el)
    const walk = (node) => {
      let html = ''
      for (const n of node.childNodes) {
        if (n.nodeType === 3) {
          html += n.textContent.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
          continue
        }
        if (n.nodeType !== 1 || SKIP_TAGS.has(n.tagName)) continue
        const s = getComputedStyle(n)
        if (s.display === 'none') continue
        const tag = n.tagName.toLowerCase()
        if (tag === 'br') { html += '<br>'; continue }
        const styles = []
        if (s.color !== base.color) styles.push(`color:${s.color}`)
        if (s.fontWeight !== base.fontWeight) styles.push(`font-weight:${s.fontWeight}`)
        if (s.fontStyle !== base.fontStyle) styles.push(`font-style:${s.fontStyle}`)
        if ((s.webkitBackgroundClip || s.backgroundClip) === 'text' && s.backgroundImage !== 'none') {
          styles.push(`background-image:${s.backgroundImage}`, '-webkit-background-clip:text', 'background-clip:text', 'color:transparent', '-webkit-text-fill-color:transparent')
        }
        const keep = ['a', 'strong', 'b', 'em', 'i', 'u', 'small', 'sup', 'sub', 'code', 'mark', 's', 'span']
        const t = keep.includes(tag) ? tag : 'span'
        let attrs = ''
        if (t === 'a') {
          const href = n.getAttribute('href') || ''
          attrs += ` href="${href.replace(/"/g, '&quot;')}"`
          if (n.getAttribute('target')) attrs += ` target="${n.getAttribute('target')}"`
          if (n.getAttribute('rel')) attrs += ` rel="${n.getAttribute('rel')}"`
        }
        if (styles.length) attrs += ` style="${styles.join(';').replace(/"/g, "'")}"`
        html += `<${t}${attrs}>${walk(n)}</${t}>`
      }
      return html
    }
    return walk(el).replace(/\s+/g, ' ').trim()
  }

  const nodeFor = (el, depth) => {
    if (SKIP_TAGS.has(el.tagName)) return null
    const s = getComputedStyle(el)
    const id = idOf(el)
    const rect = el.getBoundingClientRect()
    const base = {
      id,
      tag: el.tagName.toLowerCase(),
      hidden: isHidden(el, s),
      rect: { x: Math.round(rect.left + window.scrollX), y: Math.round(rect.top + window.scrollY), w: Math.round(rect.width), h: Math.round(rect.height) },
      style: styleOf(el),
      cls: (el.getAttribute('class') || '').slice(0, 300),
      attrs: {},
    }
    if (base.hidden) return { ...base, kind: 'hidden', children: [] }
    // An accordion read by capture.mjs (readAccordions): one node with every item's title and content.
    if (el.hasAttribute('data-acv-accordion') && window.__acvAccordions) {
      const data = window.__acvAccordions[Number(el.getAttribute('data-acv-accordion'))]
      if (data) return { ...base, kind: 'accordion', accordion: data, children: [] }
    }
    const tag = el.tagName
    const href = el.closest('a') && el.tagName === 'A' ? el.getAttribute('href') : null
    if (href) base.attrs.href = href
    if (el.getAttribute('target')) base.attrs.target = el.getAttribute('target')
    if (el.getAttribute('aria-label')) base.attrs.ariaLabel = el.getAttribute('aria-label')
    if (tag === 'IMG' || tag === 'PICTURE') {
      const img = tag === 'IMG' ? el : el.querySelector('img')
      return { ...base, kind: 'image', attrs: { ...base.attrs, src: img ? img.currentSrc || img.src : '', alt: img ? img.alt : '', natural: img ? [img.naturalWidth, img.naturalHeight] : [0, 0], href: el.closest('a') ? el.closest('a').getAttribute('href') : null }, children: [] }
    }
    if (tag === 'SVG' || el instanceof SVGElement) {
      return { ...base, tag: 'svg', kind: 'svg', html: el.outerHTML.replace(/\sdata-acv-id="[^"]*"/g, ''), children: [] }
    }
    // A video becomes Elementor's Video widget (poster, play icon, playback built in), so the
    // page's own scripted "Play" overlay button on top of it is left out.
    if (tag === 'VIDEO') {
      const source = el.querySelector('source')
      const src = el.currentSrc || el.src || (source ? source.src : '')
      if (src) return { ...base, kind: 'video', attrs: { ...base.attrs, src, poster: el.poster || '', autoplay: el.autoplay, muted: el.muted, loop: el.loop, controls: el.controls }, children: [] }
    }
    if (tag === 'BUTTON' && s.position === 'absolute' && el.parentElement && el.parentElement.querySelector(':scope > video')) return null
    // A scripted "Read more" that unclamps the text before it: the text is shown in full instead.
    const before = el.previousElementSibling
    if (tag === 'BUTTON' && /^\s*(read|show) more\s*$/i.test(el.textContent) && before && getComputedStyle(before).webkitLineClamp !== 'none') return null
    if (tag === 'IFRAME' || tag === 'VIDEO' || tag === 'CANVAS') {
      return { ...base, kind: 'embed', html: el.outerHTML.replace(/\sdata-acv-id="[^"]*"/g, ''), attrs: { ...base.attrs, src: el.getAttribute('src') || '' }, children: [] }
    }
    if (tag === 'FORM') {
      // Which fields share a row (e.g. phone and email side by side), by their position on screen.
      const fieldRows = []
      for (const f of el.querySelectorAll('input[name],select[name],textarea[name]')) {
        const r = f.getBoundingClientRect()
        if (!r.width || f.type === 'hidden') continue
        const row = fieldRows.find((x) => Math.abs(x.top - r.top) <= 2)
        if (row) row.names.push(f.name)
        else fieldRows.push({ top: r.top, names: [f.name] })
      }
      return { ...base, kind: 'form', html: el.outerHTML.replace(/\sdata-acv-id="[^"]*"/g, ''), attrs: { ...base.attrs, action: el.getAttribute('action') || '', fieldRows: fieldRows.map((x) => x.names) }, children: [] }
    }
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      return { ...base, kind: 'embed', html: el.outerHTML.replace(/\sdata-acv-id="[^"]*"/g, ''), children: [] }
    }
    // Text leaves: headings, paragraphs and simple links/buttons made only of inline content.
    const text = (el.innerText || '').trim()
    if (text && isInlineOnly(el) && !el.querySelector('img,svg,picture,video,iframe')) {
      return {
        ...base,
        kind: /^H[1-6]$/.test(tag) ? 'heading' : (tag === 'A' || tag === 'BUTTON') ? 'link' : 'text',
        text,
        html: cleanInlineHtml(el),
        attrs: {
          ...base.attrs,
          href: tag === 'A' ? el.getAttribute('href') : (el.closest('a') ? el.closest('a').getAttribute('href') : null),
          // Clamped to a few lines with a scripted "Read more" after it (the button itself is left
          // out): becomes the plugin's Read more (CSS class acv-readmore), same lines and label.
          readmore: el.nextElementSibling && el.nextElementSibling.tagName === 'BUTTON' && /^\s*(read|show) more\s*$/i.test(el.nextElementSibling.textContent) ? el.nextElementSibling.textContent.trim() : '',
        },
        children: [],
      }
    }
    if (tag === 'BUTTON' && !el.querySelector('img,svg')) {
      return { ...base, kind: 'link', text, html: cleanInlineHtml(el), children: [] }
    }
    // Containers. Loose text next to elements becomes its own text leaf.
    const children = []
    for (const child of el.childNodes) {
      if (child.nodeType === 3) {
        const t = child.textContent.trim()
        if (!t) continue
        const range = document.createRange()
        range.selectNodeContents(child)
        const r = range.getBoundingClientRect()
        // The text inherits the parent's text styling only; the parent's box (background, padding,
        // border, shadow, size) stays on the parent, or a badge would be drawn twice.
        const style = { ...styleOf(el), ...LOOSE_TEXT_BOX }
        children.push({ id: `${id}-t${children.length}`, tag: 'span', kind: 'text', text: t, html: t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]), rect: { x: Math.round(r.left + window.scrollX), y: Math.round(r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) }, style, cls: '', attrs: {}, children: [] })
        continue
      }
      if (child.nodeType !== 1) continue
      const n = nodeFor(child, depth + 1)
      if (n) children.push(n)
    }
    return { ...base, kind: 'box', hasDirectText: hasDirectText(el), children }
  }

  const out = []
  for (const selector of roots) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector
    if (el) out.push(nodeFor(el, 0))
  }
  document.documentElement.dataset.acvNext = String(next)
  return {
    viewport,
    url: location.href,
    title: document.title,
    bodyStyle: { backgroundColor: getComputedStyle(document.body).backgroundColor, backgroundImage: getComputedStyle(document.body).backgroundImage, color: getComputedStyle(document.body).color, fontFamily: getComputedStyle(document.body).fontFamily },
    roots: out,
  }
}
