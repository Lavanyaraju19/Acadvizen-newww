import test from 'node:test'
import assert from 'node:assert/strict'

import { isSmtpConfigured, isRecaptchaConfigured, verifyRecaptcha, deliverWebhook, sendMail } from '../../lib/mailer.js'

function withEnv(vars, fn) {
  const original = {}
  for (const key of Object.keys(vars)) {
    original[key] = process.env[key]
    if (vars[key] === undefined) delete process.env[key]
    else process.env[key] = vars[key]
  }
  try {
    return fn()
  } finally {
    for (const key of Object.keys(vars)) {
      if (original[key] === undefined) delete process.env[key]
      else process.env[key] = original[key]
    }
  }
}

test('isSmtpConfigured requires all four SMTP env vars', () => {
  withEnv({ SMTP_HOST: undefined, SMTP_PORT: undefined, SMTP_USER: undefined, SMTP_PASS: undefined }, () => {
    assert.equal(isSmtpConfigured(), false)
  })
  withEnv({ SMTP_HOST: 'smtp.example.com', SMTP_PORT: '587', SMTP_USER: 'user', SMTP_PASS: 'pass' }, () => {
    assert.equal(isSmtpConfigured(), true)
  })
  withEnv({ SMTP_HOST: 'smtp.example.com', SMTP_PORT: undefined, SMTP_USER: 'user', SMTP_PASS: 'pass' }, () => {
    assert.equal(isSmtpConfigured(), false)
  })
})

test('sendMail reports a clear reason when SMTP is not configured, never throws', async () => {
  await withEnv({ SMTP_HOST: undefined, SMTP_PORT: undefined, SMTP_USER: undefined, SMTP_PASS: undefined }, async () => {
    const result = await sendMail({ to: 'a@b.com', subject: 'Hi', html: '<p>hi</p>' })
    assert.equal(result.sent, false)
    assert.match(result.reason, /SMTP is not configured/)
  })
})

test('sendMail reports a reason when no recipient is given', async () => {
  const result = await sendMail({ to: '', subject: 'Hi' })
  assert.equal(result.sent, false)
  assert.match(result.reason, /recipient/)
})

test('isRecaptchaConfigured reflects RECAPTCHA_SECRET_KEY presence', () => {
  withEnv({ RECAPTCHA_SECRET_KEY: undefined }, () => assert.equal(isRecaptchaConfigured(), false))
  withEnv({ RECAPTCHA_SECRET_KEY: 'secret' }, () => assert.equal(isRecaptchaConfigured(), true))
})

test('verifyRecaptcha skips verification entirely when unconfigured (never blocks submissions)', async () => {
  await withEnv({ RECAPTCHA_SECRET_KEY: undefined }, async () => {
    const result = await verifyRecaptcha('any-token')
    assert.deepEqual(result, { verified: true, skipped: true })
  })
})

test('verifyRecaptcha rejects a missing token when configured', async () => {
  await withEnv({ RECAPTCHA_SECRET_KEY: 'secret' }, async () => {
    const result = await verifyRecaptcha('')
    assert.equal(result.verified, false)
    assert.match(result.reason, /token/)
  })
})

test('verifyRecaptcha calls Google siteverify and honors the mocked response (mocked integration test - no real secret available in this environment)', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url) => {
    assert.match(String(url), /siteverify/)
    return { json: async () => ({ success: true }) }
  }
  try {
    await withEnv({ RECAPTCHA_SECRET_KEY: 'secret' }, async () => {
      const result = await verifyRecaptcha('a-token', '1.2.3.4')
      assert.equal(result.verified, true)
    })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('verifyRecaptcha surfaces a failed Google verification', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({ json: async () => ({ success: false }) })
  try {
    await withEnv({ RECAPTCHA_SECRET_KEY: 'secret' }, async () => {
      const result = await verifyRecaptcha('a-token')
      assert.equal(result.verified, false)
    })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('deliverWebhook posts JSON and reports delivered:true on a 2xx (mocked - no live endpoint in this environment)', async () => {
  const originalFetch = globalThis.fetch
  let capturedBody = null
  globalThis.fetch = async (url, init) => {
    capturedBody = JSON.parse(init.body)
    return { ok: true, status: 200 }
  }
  try {
    const result = await deliverWebhook('https://hooks.example.com/x', { hello: 'world' })
    assert.equal(result.delivered, true)
    assert.deepEqual(capturedBody, { hello: 'world' })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('deliverWebhook reports delivered:false without throwing when the endpoint errors', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => { throw new Error('ECONNREFUSED') }
  try {
    const result = await deliverWebhook('https://hooks.example.com/x', {})
    assert.equal(result.delivered, false)
    assert.match(result.reason, /ECONNREFUSED/)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('deliverWebhook reports a reason when no URL is configured', async () => {
  const result = await deliverWebhook('', {})
  assert.equal(result.delivered, false)
  assert.match(result.reason, /webhook URL/)
})
