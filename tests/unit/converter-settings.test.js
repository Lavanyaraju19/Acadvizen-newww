import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeSettings } from '../../tools/main-to-elementor/convert.mjs'

test('converter: a badge keeps its global typography next to its global colours', () => {
  const merged = mergeSettings(
    { editor: '<p>Design</p>' },
    { __globals__: { typography_typography: 'globals/typography?id=t1' } },
    { _padding: { top: '4' }, __globals__: { _background_color: 'globals/colors?id=c1', _border_color: 'globals/colors?id=c2' } },
  )
  assert.equal(merged.editor, '<p>Design</p>')
  assert.deepEqual(merged.__globals__, { typography_typography: 'globals/typography?id=t1', _background_color: 'globals/colors?id=c1', _border_color: 'globals/colors?id=c2' })
  assert.deepEqual(merged._padding, { top: '4' })
})

test('converter: parts without global styles merge as before', () => {
  assert.deepEqual(mergeSettings({ a: 1 }, null, { b: 2 }), { a: 1, b: 2 })
})
