import test from 'node:test'
import assert from 'node:assert/strict'

import { withOneQuickRetry } from '../../lib/wordpress/retry.js'

const failure = (message, status) => Object.assign(new Error(message), status ? { status } : {})
// A fake clock: each attempt "takes" the given milliseconds; sleeping advances the clock too.
function clock(durations) {
  let t = 0
  const calls = []
  return {
    now: () => t,
    sleep: async (ms) => { t += ms },
    calls,
    attempt: async (timeoutMs) => {
      const [ms, outcome] = durations[calls.length]
      calls.push(timeoutMs)
      t += ms
      if (outcome instanceof Error) throw outcome
      return outcome
    },
  }
}

test('a quick refusal by WordPress (HTTP 5xx) is retried once and the page is served', async () => {
  const c = clock([[800, failure('WordPress responded 503', 503)], [600, 'page']])
  assert.equal(await withOneQuickRetry(c.attempt, { now: c.now, sleep: c.sleep }), 'page')
  assert.deepEqual(c.calls, [10000, 10000 - 800 - 1500])
})

test('a quick connection failure is retried once', async () => {
  const c = clock([[50, failure('WordPress request failed: fetch failed')], [400, 'page']])
  assert.equal(await withOneQuickRetry(c.attempt, { now: c.now, sleep: c.sleep }), 'page')
})

test('a timeout is not retried (the time budget is spent)', async () => {
  const c = clock([[10000, failure('WordPress request failed: timed out after 10000ms')]])
  await assert.rejects(withOneQuickRetry(c.attempt, { now: c.now, sleep: c.sleep }), /timed out/)
  assert.equal(c.calls.length, 1)
})

test('a client error (4xx other than 404) is not retried', async () => {
  const c = clock([[100, failure('WordPress responded 401', 401)]])
  await assert.rejects(withOneQuickRetry(c.attempt, { now: c.now, sleep: c.sleep }), /401/)
  assert.equal(c.calls.length, 1)
})

test('a second failure is reported, never hidden (at most two attempts)', async () => {
  const c = clock([[500, failure('WordPress responded 503', 503)], [500, failure('WordPress responded 503', 503)]])
  await assert.rejects(withOneQuickRetry(c.attempt, { now: c.now, sleep: c.sleep }), /503/)
  assert.equal(c.calls.length, 2)
})

test('no retry when too little of the budget is left', async () => {
  const c = clock([[7000, failure('WordPress responded 502', 502)]])
  await assert.rejects(withOneQuickRetry(c.attempt, { now: c.now, sleep: c.sleep }), /502/)
  assert.equal(c.calls.length, 1)
})
