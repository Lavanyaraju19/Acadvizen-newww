import test from 'node:test'
import assert from 'node:assert/strict'
import { buildMetadata } from '../../app/lib/seo.js'

test('page titles carry the site name once (the root layout template is not applied again)', () => {
  assert.deepEqual(buildMetadata({ title: 'About Us' }).title, { absolute: 'About Us | Acadvizen' })
  assert.deepEqual(buildMetadata({ title: 'About | Acadvizen' }).title, { absolute: 'About | Acadvizen' })
  assert.deepEqual(buildMetadata({}).title, { absolute: 'Acadvizen' })
})

test('social titles stay plain strings', () => {
  const meta = buildMetadata({ title: 'Tools' })
  assert.equal(meta.openGraph.title, 'Tools | Acadvizen')
  assert.equal(meta.twitter.title, 'Tools | Acadvizen')
})
