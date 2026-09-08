import test from 'node:test'
import assert from 'node:assert/strict'

import { hasValidCoordinate, hasValidCoordinatePair } from '../../lib/geo.js'

test('hasValidCoordinate rejects null, undefined, and blank/whitespace values', () => {
  assert.equal(hasValidCoordinate(null), false)
  assert.equal(hasValidCoordinate(undefined), false)
  assert.equal(hasValidCoordinate(''), false)
  assert.equal(hasValidCoordinate('   '), false)
})

test('hasValidCoordinate rejects non-numeric strings', () => {
  assert.equal(hasValidCoordinate('abc'), false)
  assert.equal(hasValidCoordinate('12.9abc'), false)
  assert.equal(hasValidCoordinate('null'), false)
})

test('hasValidCoordinate accepts real numbers and numeric strings, including 0', () => {
  assert.equal(hasValidCoordinate(0), true)
  assert.equal(hasValidCoordinate('0'), true)
  assert.equal(hasValidCoordinate(12.9799), true)
  assert.equal(hasValidCoordinate(' 12.9799 '), true)
  assert.equal(hasValidCoordinate(-77.5946), true)
})

test('hasValidCoordinatePair requires both coordinates, not just one', () => {
  assert.equal(hasValidCoordinatePair(12.9799, 77.5946), true)
  assert.equal(hasValidCoordinatePair(null, 77.5946), false)
  assert.equal(hasValidCoordinatePair(12.9799, null), false)
  assert.equal(hasValidCoordinatePair(null, null), false)
  assert.equal(hasValidCoordinatePair(undefined, undefined), false)
})
