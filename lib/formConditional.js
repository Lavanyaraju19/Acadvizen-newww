// Shared between the public form renderer (client) and the submit route (server) so
// "should this field be visible" can never drift between what the visitor saw and what
// the server accepts - see components/cms/FormEmbedRenderer.jsx and
// app/api/cms/forms/[id]/submit/route.js.

export const HONEYPOT_FIELD = '_gotcha'

export function evaluateFieldCondition(condition, values) {
  if (!condition?.enabled || !condition.fieldId) return true
  const actual = values ? values[condition.fieldId] : undefined
  const expected = condition.value
  switch (condition.operator) {
    case 'not_equals':
      return String(actual ?? '') !== String(expected ?? '')
    case 'contains':
      return String(actual ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase())
    case 'is_empty':
      return actual === undefined || actual === null || actual === ''
    case 'is_not_empty':
      return !(actual === undefined || actual === null || actual === '')
    case 'equals':
    default:
      return String(actual ?? '') === String(expected ?? '')
  }
}
