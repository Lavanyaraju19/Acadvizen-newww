import test from 'node:test'
import assert from 'node:assert/strict'
import { publicToolBySlugQuery } from '../../lib/publicToolQuery.js'

function recordingQuery() {
  const calls = []
  const query = new Proxy({}, { get: (_, method) => (...args) => { calls.push([method, ...args]); return query } })
  return { query, calls }
}

test('a tool page only reads an active tool (an unpublished tool keeps no title or schema)', () => {
  const { query, calls } = recordingQuery()
  publicToolBySlugQuery(query, 'local-e2e-tool-1779297401')
  assert.deepEqual(calls.filter(([method]) => method === 'eq'), [['eq', 'is_active', true], ['eq', 'slug', 'local-e2e-tool-1779297401']])
  assert.deepEqual(calls.at(-1), ['limit', 1])
})
