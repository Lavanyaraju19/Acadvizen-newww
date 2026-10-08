import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'

import {
  MAIN_ROUTE_SEGMENTS,
  decideBridgeRoute,
  isValidBridgePath,
  mainOwnedReason,
  normalizeBridgePath,
} from '../../lib/wordpress/bridgeRouting.js'

const manifest = {
  pages: [
    { path: '/neet-coaching', replace: false },
    { path: '/course/seo-mastery', replace: false },
    { path: '/about', replace: false },
    { path: '/contact', replace: true },
    { path: '/', replace: true },
    { path: '/digital-marketing-course-in-hebbal', replace: false },
    { path: '/existing-cms-page', replace: false },
  ],
  redirects: [{ from: '/old-neet', to: '/neet-coaching' }, { from: '/blog', to: '/neet-coaching' }],
}

test('every top-level Next.js route folder is protected from WordPress pages', () => {
  const appDir = path.resolve('app')
  const folders = [
    ...readdirSync(appDir),
    ...readdirSync(path.join(appDir, '(public)')),
  ].filter((name) => {
    const full = [path.join(appDir, name), path.join(appDir, '(public)', name)].find((candidate) => {
      try {
        return statSync(candidate).isDirectory()
      } catch {
        return false
      }
    })
    return full && !name.startsWith('(') && !name.startsWith('[') && !name.startsWith('_') && name !== 'lib'
  })
  const missing = folders.filter((name) => !MAIN_ROUTE_SEGMENTS.has(name))
  assert.deepEqual(missing, [], `Add these app route folders to MAIN_ROUTE_SEGMENTS: ${missing.join(', ')}`)
})

test('a new WordPress page at a free address is served by the bridge', () => {
  assert.equal(decideBridgeRoute({ pathname: '/neet-coaching', manifest }).action, 'bridge')
  assert.equal(decideBridgeRoute({ pathname: '/neet-coaching/', manifest }).action, 'bridge')
  assert.equal(decideBridgeRoute({ pathname: '/course/seo-mastery', manifest }).action, 'bridge')
})

test('existing Main routes win unless an administrator chose "replace"', () => {
  assert.equal(decideBridgeRoute({ pathname: '/about', manifest }).action, 'none')
  assert.equal(decideBridgeRoute({ pathname: '/contact', manifest }).action, 'bridge')
  assert.equal(decideBridgeRoute({ pathname: '/', manifest }).action, 'bridge')
  assert.equal(decideBridgeRoute({ pathname: '/', manifest: { pages: [], redirects: [] } }).action, 'none')
  assert.equal(decideBridgeRoute({ pathname: '/digital-marketing-course-in-hebbal', manifest }).action, 'none', 'programmatic SEO prefixes belong to Main')
  assert.equal(decideBridgeRoute({ pathname: '/existing-cms-page', manifest, mainPageExists: true }).action, 'none', 'Supabase CMS pages win')
})

test('application, auth and proxy routes can never be replaced', () => {
  const evil = { pages: ['/admin', '/api/x', '/login', '/dashboard', '/wp-json/x', '/wp-render', '/_acv/c/x.css', '/_acv/rest/x'].map((p) => ({ path: p, replace: true })), redirects: [] }
  for (const page of evil.pages) {
    assert.equal(decideBridgeRoute({ pathname: page.path, manifest: evil }).action, 'none', page.path)
  }
})

test('moved pages redirect, but never away from a Main-owned address', () => {
  assert.deepEqual(decideBridgeRoute({ pathname: '/old-neet', manifest }), { action: 'redirect', to: '/neet-coaching' })
  assert.equal(decideBridgeRoute({ pathname: '/blog', manifest }).action, 'none')
})

test('unknown manifest or malformed paths change nothing', () => {
  assert.equal(decideBridgeRoute({ pathname: '/neet-coaching', manifest: null }).action, 'none')
  assert.equal(decideBridgeRoute({ pathname: '/NEET', manifest }).action, 'none')
  assert.equal(isValidBridgePath('/a/../b'), false)
  assert.equal(isValidBridgePath('/%2e%2e'), false)
  assert.equal(normalizeBridgePath('//neet-coaching//'), '/neet-coaching')
  assert.equal(normalizeBridgePath(''), '/')
  assert.equal(mainOwnedReason('/'), 'homepage')
  assert.equal(mainOwnedReason('/courses/x'), 'reserved')
  assert.equal(mainOwnedReason('/course/x'), null)
})
