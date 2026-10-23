import test from 'node:test'
import assert from 'node:assert/strict'
import { inlineSettings, inlineTree, inlineBundleGlobals, kitIndex } from '../../tools/main-to-elementor/inline-globals.mjs'

const kit = {
  colors: [{ _id: 'acvmccbd5e1', title: 'Main #CBD5E1', color: '#CBD5E1' }],
  typography: [{ _id: 'acvmt94cfdba9', title: 'Main 14/20 400', typography_typography: 'custom', typography_font_family: 'Inter', typography_font_size: { unit: 'px', size: 14, sizes: [] }, typography_font_weight: '400', typography_font_size_mobile: { unit: 'px', size: 13, sizes: [] } }],
}

test('a colour reference becomes the colour itself', () => {
  const s = { title_color: '', __globals__: { title_color: 'globals/colors?id=acvmccbd5e1' } }
  assert.deepEqual(inlineSettings(s, kitIndex(kit)), { colors: 1, typography: 0 })
  assert.deepEqual(s, { title_color: '#CBD5E1' })
})

test('a typography reference becomes its fields under the same prefix, responsive sizes included', () => {
  const s = { __globals__: { title_typography_typography: 'globals/typography?id=acvmt94cfdba9' } }
  assert.deepEqual(inlineSettings(s, kitIndex(kit)), { colors: 0, typography: 1 })
  assert.equal(s.title_typography_typography, 'custom')
  assert.equal(s.title_typography_font_family, 'Inter')
  assert.deepEqual(s.title_typography_font_size, { unit: 'px', size: 14, sizes: [] })
  assert.deepEqual(s.title_typography_font_size_mobile, { unit: 'px', size: 13, sizes: [] })
  assert.equal(s.__globals__, undefined)
  const plain = { __globals__: { typography_typography: 'globals/typography?id=acvmt94cfdba9' } }
  inlineSettings(plain, kitIndex(kit))
  assert.equal(plain.typography_font_weight, '400')
})

test('references to entries that are not in the given kit (e.g. Enrollment globals) are kept', () => {
  const s = { button_text_color: '', __globals__: { button_text_color: 'globals/colors?id=primary', title_color: 'globals/colors?id=acvmccbd5e1' } }
  inlineSettings(s, kitIndex(kit))
  assert.deepEqual(s.__globals__, { button_text_color: 'globals/colors?id=primary' })
  assert.equal(s.title_color, '#CBD5E1')
})

test('nested elements are all rewritten and a bundle leaves with an empty kit', () => {
  const tree = [{ settings: { __globals__: { background_color: 'globals/colors?id=acvmccbd5e1' } }, elements: [{ settings: { __globals__: { typography_typography: 'globals/typography?id=acvmt94cfdba9' } }, elements: [] }] }]
  const untouched = JSON.parse(JSON.stringify(tree))
  assert.deepEqual(inlineTree(tree, kitIndex(kit)), { colors: 1, typography: 1 })
  const bundle = { kit, records: [{ elementor_data: untouched, page_settings: { __globals__: { background_color: 'globals/colors?id=acvmccbd5e1' } } }], templates: [] }
  assert.deepEqual(inlineBundleGlobals(bundle), { colors: 2, typography: 1 })
  assert.deepEqual(bundle.kit, {})
  assert.equal(JSON.stringify(bundle).includes('globals/'), false)
})
