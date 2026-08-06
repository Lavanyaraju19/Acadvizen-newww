import test from 'node:test'
import assert from 'node:assert/strict'

import { HONEYPOT_FIELD, evaluateFieldCondition } from '../../lib/formConditional.js'

test('evaluateFieldCondition returns true when the condition is disabled or unset', () => {
  assert.equal(evaluateFieldCondition(undefined, {}), true)
  assert.equal(evaluateFieldCondition({ enabled: false, fieldId: 'x', operator: 'equals', value: '1' }, { x: '2' }), true)
  assert.equal(evaluateFieldCondition({ enabled: true, fieldId: '', operator: 'equals', value: '1' }, { x: '2' }), true)
})

test('evaluateFieldCondition supports equals / not_equals', () => {
  const cond = { enabled: true, fieldId: 'interest', operator: 'equals', value: 'course' }
  assert.equal(evaluateFieldCondition(cond, { interest: 'course' }), true)
  assert.equal(evaluateFieldCondition(cond, { interest: 'internship' }), false)

  const negated = { ...cond, operator: 'not_equals' }
  assert.equal(evaluateFieldCondition(negated, { interest: 'internship' }), true)
  assert.equal(evaluateFieldCondition(negated, { interest: 'course' }), false)
})

test('evaluateFieldCondition supports contains (case-insensitive)', () => {
  const cond = { enabled: true, fieldId: 'message', operator: 'contains', value: 'REFUND' }
  assert.equal(evaluateFieldCondition(cond, { message: 'I need a refund please' }), true)
  assert.equal(evaluateFieldCondition(cond, { message: 'Just a question' }), false)
})

test('evaluateFieldCondition supports is_empty / is_not_empty', () => {
  const empty = { enabled: true, fieldId: 'phone', operator: 'is_empty' }
  assert.equal(evaluateFieldCondition(empty, { phone: '' }), true)
  assert.equal(evaluateFieldCondition(empty, {}), true)
  assert.equal(evaluateFieldCondition(empty, { phone: '123' }), false)

  const notEmpty = { enabled: true, fieldId: 'phone', operator: 'is_not_empty' }
  assert.equal(evaluateFieldCondition(notEmpty, { phone: '123' }), true)
  assert.equal(evaluateFieldCondition(notEmpty, { phone: '' }), false)
})

test('HONEYPOT_FIELD is a stable reserved key shared by the client renderer and the submit route', () => {
  assert.equal(HONEYPOT_FIELD, '_gotcha')
})
