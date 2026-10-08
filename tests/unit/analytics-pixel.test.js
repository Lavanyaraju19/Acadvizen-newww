import test from 'node:test'
import assert from 'node:assert/strict'
import { isMetaPixelEnabled } from '../../lib/analyticsConfig.js'
import { buildAnalyticsSnippets } from '../../lib/wordpress/document.js'

test('Meta pixel: on for the live site, off on Vercel preview deployments (staging)', () => {
  assert.equal(isMetaPixelEnabled({ VERCEL_ENV: 'production' }), true)
  assert.equal(isMetaPixelEnabled({}), true)
  assert.equal(isMetaPixelEnabled({ VERCEL_ENV: 'preview' }), false)
  assert.equal(isMetaPixelEnabled({ VERCEL_ENV: 'production', META_PIXEL_DISABLED: 'true' }), false)
})

test('WordPress-rendered Main pages carry the Meta pixel independently of GA/GTM', () => {
  const pixelOnly = buildAnalyticsSnippets({ enabled: false, gtmId: 'GTM-1', gaId: 'G-1', metaPixelId: '123', metaPixelEnabled: true })
  assert.match(pixelOnly.head, /fbq\('init','123'\)/)
  assert.doesNotMatch(pixelOnly.head, /googletagmanager/)
  const staging = buildAnalyticsSnippets({ enabled: false, gtmId: 'GTM-1', gaId: 'G-1', metaPixelId: '123', metaPixelEnabled: false })
  assert.equal(staging.head + staging.body, '')
})
