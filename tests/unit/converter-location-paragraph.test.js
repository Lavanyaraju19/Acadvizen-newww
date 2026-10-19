import test from 'node:test'
import assert from 'node:assert/strict'
import { visibleParagraph } from '../../tools/main-to-elementor/families.mjs'

// Main draws a section-less location page as <h2>title</h2><div><p>description</p></div> (seen live on
// /seo-course-in-jayanagar, 19 Oct 2026); the old pattern needed the <p> right after the heading.
test('location paragraph: found when it sits in its own wrapper after the heading', () => {
  const html = '<nav><span>SEO Course In Jayanagar</span></nav><section class="a"><div class="b"><h2 class="c">SEO Course In Jayanagar</h2><div class="d"><p class="e">Master Search Engine Optimization in Jayanagar.</p></div></div></section>'
  assert.equal(visibleParagraph(html), 'Master Search Engine Optimization in Jayanagar.')
})

test('location paragraph: still found directly after the heading', () => {
  assert.equal(visibleParagraph('<h1>Title</h1>\n<p>Body text.</p>'), 'Body text.')
})

test('location paragraph: each page gives its own text, never another page\'s', () => {
  const page = (city) => `<h2>SEO Course In ${city}</h2><div><p>Learn SEO in ${city}.</p></div>`
  assert.deepEqual(['Jayanagar', 'Bidadi'].map((c) => visibleParagraph(page(c))), ['Learn SEO in Jayanagar.', 'Learn SEO in Bidadi.'])
})

test('location paragraph: empty when the page has no heading followed by a paragraph', () => {
  assert.equal(visibleParagraph('<h2>Title</h2><ul><li>Item</li></ul>'), '')
  assert.equal(visibleParagraph(''), '')
})
