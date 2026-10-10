import test from 'node:test'
import assert from 'node:assert/strict'
import { isMissingOrderColumn } from '../../lib/cmsEntities.js'

test('a missing order column is recognised (production tools_extended has no order_index)', () => {
  assert.equal(isMissingOrderColumn({ code: '42703', message: 'column tools_extended.order_index does not exist' }, 'order_index'), true)
})

test('other errors are not treated as a missing order column', () => {
  assert.equal(isMissingOrderColumn({ code: '42P01', message: 'relation "x" does not exist' }, 'order_index'), false)
  assert.equal(isMissingOrderColumn({ code: '42703', message: 'column tools_extended.slug does not exist' }, 'order_index'), false)
  assert.equal(isMissingOrderColumn(null, 'order_index'), false)
})
