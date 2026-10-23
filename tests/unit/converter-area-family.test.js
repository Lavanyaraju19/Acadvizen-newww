import test from 'node:test'
import assert from 'node:assert/strict'
import { nameFromSlug, bindName, AREA_ROUTE, CITY_COURSE_ROUTE } from '../../tools/main-to-elementor/families.mjs'

// Area / city course pages are drawn by Main from an address alone (LocationPageRenderer, CityCoursePageRenderer).

test('area name: written as Main writes it, from the address', () => {
  assert.equal(nameFromSlug('jp-nagar'), 'Jp Nagar')
  assert.equal(nameFromSlug('jayanagar'), 'Jayanagar')
  assert.equal(nameFromSlug('hsr-layout'), 'Hsr Layout')
})

test('area name: bound in visible text only, never inside link addresses', () => {
  const els = [{ id: 'a', elType: 'widget', widgetType: 'text-editor', settings: { editor: '<p>Learn in Jayanagar. <a href="/digital-marketing-courses-Jayanagar">More</a></p>' }, elements: [] },
    { id: 'b', elType: 'widget', widgetType: 'heading', settings: { title: 'Digital Marketing Courses in Jayanagar' }, elements: [] }]
  assert.equal(bindName(els, 'Jayanagar'), 2)
  assert.equal(els[0].settings.editor, '<p>Learn in [acv_field name="title"]. <a href="/digital-marketing-courses-Jayanagar">More</a></p>')
  assert.equal(els[1].settings.title, 'Digital Marketing Courses in [acv_field name="title"]')
})

test('area routes: the 15 data-generated city addresses, not the -in- Page Builder pages', () => {
  assert.ok(AREA_ROUTE.test('/digital-marketing-courses-jayanagar'))
  assert.ok(CITY_COURSE_ROUTE.test('/digital-marketing-course-bangalore'))
  assert.ok(!CITY_COURSE_ROUTE.test('/digital-marketing-course-in-btm-layout'))
  assert.ok(!AREA_ROUTE.test('/digital-marketing-course-in-btm-layout'))
})

test('nearby areas: read from the page\'s own "Nearby areas" section, in order, footer links ignored', async () => {
  const { nearbyOrder } = await import('../../tools/main-to-elementor/families.mjs')
  const html = '<section><h2>Nearby areas in the city</h2><a href="/digital-marketing-courses-jp-nagar">JP</a><a href="/digital-marketing-courses-koramangala">K</a></section><footer><a href="/digital-marketing-courses-whitefield">W</a></footer>'
  assert.deepEqual(nearbyOrder(html), ['jp-nagar', 'koramangala'])
  assert.deepEqual(nearbyOrder('<p>no list</p>'), [])
})

test('nearby areas: one order consistent with every live list (Main\'s order_index)', async () => {
  const { mergeOrder } = await import('../../tools/main-to-elementor/families.mjs')
  const lists = [['jp-nagar', 'koramangala', 'indiranagar'], ['jayanagar', 'jp-nagar'], ['koramangala', 'indiranagar', 'mg-road']]
  assert.deepEqual(mergeOrder(lists, ['mg-road', 'indiranagar', 'jayanagar', 'koramangala', 'jp-nagar', 'whitefield']), ['jayanagar', 'jp-nagar', 'koramangala', 'indiranagar', 'mg-road', 'whitefield'])
})

test('nearby areas: a full list (the first six) puts every candidate it leaves out after its last one', async () => {
  const { mergeOrder } = await import('../../tools/main-to-elementor/families.mjs')
  // As live on 21 Oct 2026: Jayanagar lists six areas ending with rr-nagar; hsr-layout and whitefield
  // are candidates (same city) that are not listed, so they come after rr-nagar, never first by name.
  const all = ['hsr-layout', 'jayanagar', 'jp-nagar', 'koramangala', 'indiranagar', 'mg-road', 'rajajinagar', 'rr-nagar', 'whitefield']
  const jayanagar = { list: ['jp-nagar', 'koramangala', 'indiranagar', 'mg-road', 'rajajinagar', 'rr-nagar'], candidates: all.filter((s) => s !== 'jayanagar') }
  const jpNagar = { list: ['jayanagar', 'koramangala', 'indiranagar', 'mg-road', 'rajajinagar', 'rr-nagar'], candidates: all.filter((s) => s !== 'jp-nagar') }
  const order = mergeOrder([jayanagar, jpNagar], all)
  assert.deepEqual(order.slice(0, 8), ['jayanagar', 'jp-nagar', 'koramangala', 'indiranagar', 'mg-road', 'rajajinagar', 'rr-nagar', 'hsr-layout'])
  assert.ok(order.indexOf('whitefield') > order.indexOf('rr-nagar'))
})

test('area name: bound inside accordion items too, never inside a link to another page', () => {
  const els = [
    { id: 'f', elType: 'widget', widgetType: 'nested-accordion', settings: { items: [{ item_title: 'Can I attend from Bangalore?' }] }, elements: [] },
    { id: 'r', elType: 'widget', widgetType: 'text-editor', settings: { editor: '<p>Read <a href="/blog/x">Digital Marketing Course in Bangalore: Fees</a> in Bangalore</p>' }, elements: [] },
    { id: 'c', elType: 'container', settings: { link: { url: '/blog/y' } }, elements: [{ id: 'h', elType: 'widget', widgetType: 'heading', settings: { title: 'Bangalore guide' }, elements: [] }] },
  ]
  bindName(els, 'Bangalore')
  assert.equal(els[0].settings.items[0].item_title, 'Can I attend from [acv_field name="title"]?')
  assert.equal(els[1].settings.editor, '<p>Read <a href="/blog/x">Digital Marketing Course in Bangalore: Fees</a> in [acv_field name="title"]</p>')
  assert.equal(els[2].elements[0].settings.title, 'Bangalore guide')
})

test('area texts: each page\'s own introduction and "Nearby areas" title', async () => {
  const { areaTexts } = await import('../../tools/main-to-elementor/families.mjs')
  const html = '<main><h1>Digital Marketing Courses in India</h1><div><p>Explore digital marketing courses across India</p></div><section><h2>Nearby areas in Bangalore</h2></section></main>'
  assert.deepEqual(areaTexts(html), { intro: 'Explore digital marketing courses across India', nearby: 'Nearby areas in Bangalore', heading: 'Digital Marketing Courses in India' })
})
