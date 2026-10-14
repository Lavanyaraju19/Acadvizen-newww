import test from 'node:test'
import assert from 'node:assert/strict'
import { blogCardGrid } from '../../tools/main-to-elementor/families.mjs'

const box = (elements, settings = {}) => ({ elType: 'container', settings, elements })
const text = (editor) => ({ elType: 'widget', widgetType: 'text-editor', settings: { editor }, elements: [] })
const image = () => ({ elType: 'widget', widgetType: 'image', settings: { image: { url: 'x.jpg' } }, elements: [] })
// A Main blog card: one link around the image and the text block (date, title, summary, "Read article").
const card = (slug) => box([box([image()]), box([text('Oct 8, 2026'), text('Title'), text('Summary'), text('Read article')])], { html_tag: 'a', link: { url: `/blog/${slug}` } })

test('blog grid: one post on the website -> the row of cards, not the card text block', () => {
  const row = box([card('only-post')])
  const section = box([text('From the Blog'), box([row])], { html_tag: 'section' })
  assert.equal(blogCardGrid([section]).el, row)
})

test('blog grid: several posts -> the row holding every card', () => {
  const row = box([card('a'), card('b'), card('c'), card('d')])
  assert.equal(blogCardGrid([box([text('From the Blog'), row])]).el, row)
})

test('blog grid: a card whose image and title both link to the same post is a card, not a grid', () => {
  const linked = (slug) => box([box([image()], { html_tag: 'a', link: { url: `/blog/${slug}` } }), box([text(`<a href="/blog/${slug}">Title</a>`)])])
  const row = box([linked('a'), linked('b')])
  assert.equal(blogCardGrid([row]).el, row)
  assert.equal(blogCardGrid([linked('a')]), null)
})

test('blog grid: author and category links are not posts', () => {
  assert.equal(blogCardGrid([box([box([text('<a href="/blog/author/x">Author</a>')])])]), null)
})

test('blog grid: one post, as on Main (section > wrapper > panel [heading row, card row]) -> the card row only', () => {
  const row = box([card('only-post')])
  const panel = box([box([text('From the Blog'), text('Latest insights')]), row])
  assert.equal(blogCardGrid([box([box([panel])], { html_tag: 'section' })]).el, row)
})

test('blog card date format follows the captured card', async () => {
  const { dateFormatOf } = await import('../../tools/main-to-elementor/families.mjs')
  assert.equal(dateFormatOf('Oct 8, 2026'), 'M j, Y')
  assert.equal(dateFormatOf('8 OCT 2026'), 'j M Y')
  assert.equal(dateFormatOf('October 8, 2026'), 'F j, Y')
})

test('capture: the server HTML description wins over a script-rewritten one; browser fills the gaps', async () => {
  const { serverSeo, mergeSeo } = await import('../../tools/main-to-elementor/capture.mjs')
  const html = '<head><title>Google Ads Course | Acadvizen</title><meta name="description" content="Landing page &amp; course"/><link rel="canonical" href="https://www.acadvizen.com/g"/></head>'
  const merged = mergeSeo({ title: 'X', description: 'Rewritten by a script', canonical: '', robots: 'index, follow', json_ld: ['{}'] }, serverSeo(html))
  assert.equal(merged.description, 'Landing page & course')
  assert.equal(merged.title, 'Google Ads Course | Acadvizen')
  assert.equal(merged.canonical, 'https://www.acadvizen.com/g')
  assert.equal(merged.robots, 'index, follow')
  assert.deepEqual(merged.json_ld, ['{}'])
})
