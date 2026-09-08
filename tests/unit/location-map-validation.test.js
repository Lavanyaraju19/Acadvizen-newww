import test from 'node:test'
import assert from 'node:assert/strict'

import { validateCoordinate, validateEntity } from '../../lib/validation.js'

test('validateCoordinate treats blank/null/undefined as valid (field is optional)', () => {
  assert.equal(validateCoordinate(null, { min: -90, max: 90, label: 'Latitude' }).valid, true)
  assert.equal(validateCoordinate(undefined, { min: -90, max: 90, label: 'Latitude' }).valid, true)
  assert.equal(validateCoordinate('', { min: -90, max: 90, label: 'Latitude' }).valid, true)
  assert.equal(validateCoordinate('   ', { min: -90, max: 90, label: 'Latitude' }).valid, true)
})

test('validateCoordinate rejects non-numeric input', () => {
  const result = validateCoordinate('abc', { min: -90, max: 90, label: 'Latitude' })
  assert.equal(result.valid, false)
  assert.match(result.error, /valid number/)
})

test('validateCoordinate rejects out-of-range latitude/longitude', () => {
  assert.equal(validateCoordinate(91, { min: -90, max: 90, label: 'Latitude' }).valid, false)
  assert.equal(validateCoordinate(-91, { min: -90, max: 90, label: 'Latitude' }).valid, false)
  assert.equal(validateCoordinate(181, { min: -180, max: 180, label: 'Longitude' }).valid, false)
  assert.equal(validateCoordinate(-181, { min: -180, max: 180, label: 'Longitude' }).valid, false)
})

test('validateCoordinate accepts real in-range values including 0 and trims accidental spaces', () => {
  assert.equal(validateCoordinate(0, { min: -90, max: 90, label: 'Latitude' }).valid, true)
  assert.equal(validateCoordinate(' 12.9799 ', { min: -90, max: 90, label: 'Latitude' }).valid, true)
})

test('validateEntity("locations") requires latitude and longitude together, not one alone', () => {
  const onlyLat = validateEntity('locations', { name: 'Test Area', slug: 'test-area', latitude: 12.9799, longitude: null })
  assert.equal(onlyLat.valid, false)
  assert.equal(onlyLat.errors.some((e) => e.includes('both Latitude and Longitude')), true)

  const onlyLng = validateEntity('locations', { name: 'Test Area', slug: 'test-area', latitude: '', longitude: 77.5946 })
  assert.equal(onlyLng.valid, false)

  const both = validateEntity('locations', { name: 'Test Area', slug: 'test-area', latitude: 12.9799, longitude: 77.5946 })
  assert.equal(both.valid, true)

  const neither = validateEntity('locations', { name: 'Test Area', slug: 'test-area', latitude: null, longitude: null })
  assert.equal(neither.valid, true)
})

test('validateEntity("locations") rejects out-of-range coordinates end-to-end', () => {
  const result = validateEntity('locations', { name: 'Test Area', slug: 'test-area', latitude: 200, longitude: 77.5946 })
  assert.equal(result.valid, false)
  assert.equal(result.errors.some((e) => e.includes('Latitude must be between -90 and 90')), true)
})
