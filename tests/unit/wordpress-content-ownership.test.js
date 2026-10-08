import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'

import { APPLICATION_ENTITIES, WORDPRESS_OWNED_CMS_AREAS, isWordPressOwnedWrite, isWordPressOwnershipEnabled } from '../../lib/wordpress/contentOwnership.js'

const enabled = true

test('switched off by default: nothing is refused', () => {
  assert.equal(isWordPressOwnershipEnabled({}), false)
  assert.equal(isWordPressOwnedWrite({ method: 'POST', pathname: '/api/cms/pages', enabled: false }), false)
  assert.equal(isWordPressOwnershipEnabled({ WORDPRESS_OWNS_PUBLIC_CONTENT: 'true' }), true)
})

test('content writes are refused once WordPress owns the content', () => {
  for (const [method, pathname] of [['POST', '/api/cms/pages'], ['PATCH', '/api/cms/pages/123'], ['PUT', '/api/cms/header'], ['DELETE', '/api/cms/blogs/9'], ['POST', '/api/cms/menus'], ['POST', '/api/cms/entities/tools_extended'], ['PATCH', '/api/cms/entities/locations'], ['POST', '/api/cms/homepage/hero']]) {
    assert.equal(isWordPressOwnedWrite({ method, pathname, enabled }), true, `${method} ${pathname}`)
  }
})

test('reading content stays allowed', () => {
  assert.equal(isWordPressOwnedWrite({ method: 'GET', pathname: '/api/cms/pages', enabled }), false)
  assert.equal(isWordPressOwnedWrite({ method: 'HEAD', pathname: '/api/cms/header', enabled }), false)
})

test('application data is never refused', () => {
  for (const pathname of ['/api/cms/leads', '/api/cms/users/1', '/api/cms/upload', '/api/cms/media', '/api/cms/audit-log', '/api/cms/entities/lms_lessons', '/api/cms/entities/roles', '/api/admin/login']) {
    assert.equal(isWordPressOwnedWrite({ method: 'POST', pathname, enabled }), false, pathname)
  }
  assert.ok(APPLICATION_ENTITIES.has('lms_modules'))
})

test('every owned area is a real /api/cms route folder', () => {
  const dir = path.join(process.cwd(), 'app', 'api', 'cms')
  const folders = new Set(readdirSync(dir).filter((f) => statSync(path.join(dir, f)).isDirectory()))
  for (const area of WORDPRESS_OWNED_CMS_AREAS) assert.ok(folders.has(area), `app/api/cms/${area} exists`)
})
