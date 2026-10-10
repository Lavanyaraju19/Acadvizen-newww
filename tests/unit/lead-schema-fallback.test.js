import test from 'node:test'
import assert from 'node:assert/strict'
import { moveMissingColumnIntoPayload } from '../../lib/leadSchemaFallback.js'

const lead = { full_name: 'Test Person', email: 't@example.invalid', phone: '1', form_type: 'contact', payload: { message: 'hi' } }

test('an older leads table without full_name keeps the name in "name"', () => {
  const next = moveMissingColumnIntoPayload(lead, 'full_name')
  assert.equal(next.name, 'Test Person')
  assert.equal('full_name' in next, false)
  assert.deepEqual(next.payload, { message: 'hi' })
})

test('other missing columns move into payload', () => {
  const next = moveMissingColumnIntoPayload(lead, 'form_type')
  assert.equal('form_type' in next, false)
  assert.deepEqual(next.payload, { message: 'hi', form_type: 'contact' })
})

test('a missing payload column is dropped, the rest kept', () => {
  const next = moveMissingColumnIntoPayload(lead, 'payload')
  assert.equal('payload' in next, false)
  assert.equal(next.full_name, 'Test Person')
})

test('when "name" is also missing, the name is still kept (moved into payload)', () => {
  const step1 = moveMissingColumnIntoPayload(lead, 'full_name')
  const step2 = moveMissingColumnIntoPayload(step1, 'name')
  assert.equal(step2.payload.name, 'Test Person')
})
