import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { gridSpan, gridSpanCss, videoCoverCss, slideshowCarousel } from '../../tools/main-to-elementor/convert.mjs'
import { extractInPage } from '../../tools/main-to-elementor/extract.mjs'
import { readAccordions } from '../../tools/main-to-elementor/capture.mjs'

// Gaps found when the converted Main pages were compared with production (isolated copy, 20 Oct 2026).

test('grid span: read from computed grid-column/row start and end', () => {
  assert.equal(gridSpan('auto', 'span 2'), 2)
  assert.equal(gridSpan('span 3', 'auto'), 3)
  assert.equal(gridSpan('1', '3'), 2)
  assert.equal(gridSpan('auto', 'auto'), 1)
})

test('grid span: a 2x2 collage photo keeps its span on desktop and tablet, one track on phones', () => {
  const at = (c, r) => ({ hidden: false, style: { gridColumnStart: 'auto', gridColumnEnd: `span ${c}`, gridRowStart: 'auto', gridRowEnd: `span ${r}` } })
  const css = gridSpanCss({ desktop: at(2, 2), tablet: at(2, 2), mobile: at(1, 1) })
  assert.equal(css, 'selector{grid-column:span 2;grid-row:span 2}@media (max-width:767px){selector{grid-column:span 1;grid-row:span 1}}')
})

test('grid span: nothing added for an ordinary one-track item', () => {
  const one = { hidden: false, style: { gridColumnStart: 'auto', gridColumnEnd: 'auto', gridRowStart: 'auto', gridRowEnd: 'auto' } }
  assert.equal(gridSpanCss({ desktop: one, tablet: one, mobile: one }), '')
})

test('video cover: tint and "▶ Play Video" pill drawn on Elementor\'s overlay, label escaped', () => {
  const css = videoCoverCss({ tint: 'rgba(2, 6, 23, 0.35)', icon: '▶', label: 'Play "the" Video', pill: { bg: 'rgba(0, 0, 0, 0.55)', border: '1px solid rgba(255, 255, 255, 0.2)', radius: '9999px', padding: '8px 20px', color: 'rgb(255, 255, 255)', fontSize: '14px', fontWeight: '600', gap: '8px' } })
  assert.match(css, /\.elementor-custom-embed-image-overlay::before\{content:"";position:absolute;inset:0;background:rgba\(2, 6, 23, 0\.35\)/)
  assert.match(css, /\.elementor-custom-embed-play i,selector \.elementor-custom-embed-play svg\{display:none\}/)
  assert.match(css, /::before\{content:"▶"/)
  assert.ok(css.includes('::after{content:"Play \\"the\\" Video"}'))
  assert.equal(videoCoverCss(null), '')
})

test('slideshow: the alumni stories become a Nested Carousel with every story, own title and video per slide', () => {
  const first = { id: 'aaa1111', elType: 'container', settings: {}, isInner: true, elements: [
    { id: 'bbb2222', elType: 'widget', widgetType: 'heading', settings: { title: 'Alumni Success Story 01' }, elements: [] },
    { id: 'ccc3333', elType: 'widget', widgetType: 'video', settings: { video_type: 'hosted', external_url: { url: '/testimonials/videos/testimonial-01.mp4' } }, elements: [] },
  ] }
  const step = (n) => [{ from: 'Alumni Success Story 01', to: `Alumni Success Story 0${n}`, media: false }, { from: 'https://www.acadvizen.com/testimonials/videos/testimonial-01.mp4', to: `https://www.acadvizen.com/testimonials/videos/testimonial-0${n}.mp4`, media: true }]
  const toPath = (u) => u.replace('https://www.acadvizen.com', '')
  const c = slideshowCarousel(first, { slides: [step(1), step(2), step(3)], titles: ['Alumni Success Story 01', 'Alumni Success Story 02', 'Alumni Success Story 03'] }, 'page:n9', toPath)
  assert.equal(c.widgetType, 'nested-carousel')
  assert.deepEqual(c.settings.carousel_items.map((i) => i.slide_title), ['Alumni Success Story 01', 'Alumni Success Story 02', 'Alumni Success Story 03'])
  assert.equal(c.settings.autoplay, '')
  assert.deepEqual(c.elements.map((s) => s.elements[0].settings.title), ['Alumni Success Story 01', 'Alumni Success Story 02', 'Alumni Success Story 03'])
  assert.deepEqual(c.elements.map((s) => s.elements[1].settings.external_url.url), ['/testimonials/videos/testimonial-01.mp4', '/testimonials/videos/testimonial-02.mp4', '/testimonials/videos/testimonial-03.mp4'])
  const ids = c.elements.flatMap((s) => [s.id, ...s.elements.map((e) => e.id)])
  assert.equal(new Set(ids).size, ids.length)
})

test('slideshow: a slide is one full-width column, not the stage\'s grid around the removed buttons', () => {
  const stage = { id: 'g1', elType: 'container', isInner: true, settings: { container_type: 'grid', grid_columns_grid: { unit: 'custom', size: '56px 82px 1fr 82px 56px' }, width: { unit: 'px', size: 1280 }, background_color: '#fff' }, elements: [{ id: 'w1', elType: 'widget', widgetType: 'heading', settings: { title: 'Story 01' }, elements: [] }] }
  const c = slideshowCarousel(stage, { slides: [[{ from: 'Story 01', to: 'Story 01' }], [{ from: 'Story 01', to: 'Story 02' }]], titles: ['Story 01', 'Story 02'] }, 'p:s')
  for (const s of c.elements) {
    assert.equal(s.settings.container_type, 'flex')
    assert.equal(s.settings.grid_columns_grid, undefined)
    assert.deepEqual(s.settings.width, { unit: '%', size: 100, sizes: [] })
    assert.equal(s.settings.background_color, '#fff') // the card's own look is kept
  }
})

// Browser-side parts, against small pages in headless Chromium.
const { chromium } = createRequire(import.meta.url)('playwright')

test('extraction: inline colours are written as hex (WordPress strips "color:rgb(…)")', async () => {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.setContent('<main><h4 style="color:#f1f5f9"><span style="color:rgb(252,211,77)">180 DAYS</span> | <span style="color:rgba(110,231,183,0.5)">120+ Tools</span></h4></main>')
    const out = await page.evaluate(extractInPage, { roots: ['main'], viewport: 'desktop' })
    const h4 = out.roots[0].children[0]
    assert.equal(h4.html, '<span style="color:#fcd34d">180 DAYS</span> | <span style="color:#6ee7b780">120+ Tools</span>')
  } finally { await browser.close() }
})

test('extraction: a vertical side-tab label is recorded on the button', async () => {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.setContent('<main><button style="height:300px;width:60px"><span style="display:block;writing-mode:vertical-rl">Alumni Success Story 02</span></button></main>')
    const out = await page.evaluate(extractInPage, { roots: ['main'], viewport: 'desktop' })
    assert.equal(out.roots[0].children[0].attrs.writingMode, 'vertical-rl')
  } finally { await browser.close() }
})

test('accordions: FAQ items each wrapped in their own reveal animation are one accordion, answers included', async () => {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    const item = (q, a) => `<div style="opacity:1"><div class="glass"><button type="button" aria-expanded="false" onclick="var p=this.nextElementSibling;p.hidden=!p.hidden;this.setAttribute('aria-expanded',String(!p.hidden))"><span>${q}</span></button><div hidden>${a}</div></div></div>`
    await page.setContent(`<main><section><div class="faq">${item('Is placement assistance included?', 'Career support is available - contact admissions for details.')}${item('Do I need prior experience?', 'No prior experience is required.')}</div></section></main>`)
    await readAccordions(page)
    const found = await page.evaluate(() => window.__acvAccordions.map((a) => a.items.map((i) => [i.title, i.html])))
    assert.deepEqual(found, [[['Is placement assistance included?', 'Career support is available - contact admissions for details.'], ['Do I need prior experience?', 'No prior experience is required.']]])
    // The visitor's first view is restored: every answer closed again.
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('.faq [hidden]')].length), 2)
  } finally { await browser.close() }
})

test('accordions: two separate cards with a plain toggle each are not merged into one accordion', async () => {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    const card = (t) => `<div><div class="card"><button type="button" onclick="this.nextElementSibling.hidden=false">More</button><div hidden>${t}</div></div></div>`
    await page.setContent(`<main><section><div class="cards">${card('First card text')}${card('Second card text')}</div></section></main>`)
    await readAccordions(page)
    assert.equal(await page.evaluate(() => window.__acvAccordions.length), 0)
  } finally { await browser.close() }
})

test('footer link beside a separator: sized to its text on one line, not a measured width that wraps', async () => {
  const { Converter, DesignSystem, VIEWPORTS } = await import('../../tools/main-to-elementor/convert.mjs')
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    // As Main's footer city links: a wrapping row of items, each "|" and a link.
    const item = (t) => `<div style="display:flex;gap:12px;align-items:center"><span>|</span><a href="/x" style="font:14px/20px sans-serif">${t}</a></div>`
    await page.setContent(`<footer style="width:900px"><div style="display:flex;flex-wrap:wrap;gap:12px">${item('Digital Marketing Courses in HSR Layout')}${item('Digital Marketing Courses in Indiranagar')}</div></footer>`)
    const viewports = {}
    for (const [d, w] of Object.entries(VIEWPORTS)) { await page.setViewportSize({ width: w, height: 900 }); viewports[d] = await page.evaluate(extractInPage, { roots: ['footer'], viewport: d }) }
    const ds = new DesignSystem('Main')
    const trees = Converter.prepare(viewports)
    new Converter({ ds, seed: 't' }).collect(trees); ds.finalize()
    const out = new Converter({ ds, seed: 't' }).convertRoots(trees)
    const found = []
    const walk = (els, parent) => { for (const e of els) { if (e.elType === 'widget' && /HSR Layout/.test(JSON.stringify(e.settings))) found.push({ e, parent }); walk(e.elements || [], e) } }
    walk(out, null)
    assert.equal(found.length, 1)
    assert.equal(found[0].e.settings._element_width, 'auto')
    assert.equal(found[0].e.settings._element_custom_width, undefined)
    // The item around it (separator + link) is as wide as its content too.
    assert.match(found[0].parent.settings.custom_css || '', /width:auto/)
  } finally { await browser.close() }
})

test('extraction: a pill (inline-flex span with border and background) stays a box, not text formatting', async () => {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.setContent('<main><div class="tags"><span style="display:inline-flex;border:1px solid #fff3;background:#ffffff0a;padding:6px 14px;border-radius:999px">Placement Support</span></div></main>')
    const out = await page.evaluate(extractInPage, { roots: ['main'], viewport: 'desktop' })
    const wrapper = out.roots[0].children[0]
    assert.equal(wrapper.kind, 'box')
    assert.equal(wrapper.children[0].kind, 'text')
    assert.equal(wrapper.children[0].style.borderTopWidth, '1px')
  } finally { await browser.close() }
})

test('converter: a capped block sitting at the left of its row stays at the left (not centred as "Boxed")', async () => {
  const { Converter, DesignSystem, VIEWPORTS } = await import('../../tools/main-to-elementor/convert.mjs')
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.setContent('<main><section style="padding:0 40px"><div style="max-width:768px"><h2>A curriculum built for real growth teams</h2><p>Learn performance marketing.</p></div></section></main>')
    const viewports = {}
    for (const [d, w] of Object.entries(VIEWPORTS)) { await page.setViewportSize({ width: w, height: 900 }); viewports[d] = await page.evaluate(extractInPage, { roots: ['main'], viewport: d }) }
    const ds = new DesignSystem('Main'); const trees = Converter.prepare(viewports)
    new Converter({ ds, seed: 't' }).collect(trees); ds.finalize()
    const out = new Converter({ ds, seed: 't' }).convertRoots(trees)
    let block = null
    const walk = (els) => { for (const e of els) { if (e.elType === 'container' && /max-width:768px/.test(e.settings.custom_css || '')) block = e; walk(e.elements || []) } }
    walk(out)
    assert.ok(block, 'capped block found')
    assert.match(block.settings.custom_css, /margin-right:auto/)
    assert.notEqual(block.settings.content_width, 'boxed')
  } finally { await browser.close() }
})
