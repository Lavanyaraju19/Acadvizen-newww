import test from 'node:test'
import assert from 'node:assert/strict'

import {
  canAccessAdminProfile,
  enrichAdminProfile,
  extractRoleSlugs,
  hasProfilePermission,
  inferCmsPermissionFromPath,
} from '../../lib/adminPermissions.js'

test('extractRoleSlugs merges legacy and relational roles without duplicates', () => {
  const profile = {
    role: 'Admin',
    user_roles: [
      { roles: { slug: 'editor' } },
      { roles: [{ slug: 'admin' }, { slug: 'seo_manager' }] },
    ],
  }

  assert.deepEqual(extractRoleSlugs(profile), ['admin', 'editor', 'seo_manager'])
})

test('canAccessAdminProfile allows CMS roles and rejects non-CMS roles', () => {
  assert.equal(canAccessAdminProfile({ role: 'editor' }), true)
  assert.equal(canAccessAdminProfile({ role: 'viewer' }), true)
  assert.equal(canAccessAdminProfile({ role: 'student' }), false)
  assert.equal(canAccessAdminProfile({ role: 'sales' }), false)
})

test('hasProfilePermission respects merged relational permissions and legacy fallbacks', () => {
  const editor = enrichAdminProfile({ role: 'editor' })
  assert.equal(hasProfilePermission(editor, 'blogs', 'publish'), true)
  assert.equal(hasProfilePermission(editor, 'users', 'read'), false)

  const relational = enrichAdminProfile({
    role: 'viewer',
    user_roles: [
      {
        roles: {
          slug: 'custom_role',
          permissions: {
            users: ['read'],
            settings: ['read'],
          },
        },
      },
    ],
  })

  assert.equal(hasProfilePermission(relational, 'users', 'read'), true)
  assert.equal(hasProfilePermission(relational, 'users', 'delete'), false)
})

test('inferCmsPermissionFromPath maps high-risk admin routes to resource actions', () => {
  assert.deepEqual(
    inferCmsPermissionFromPath('/api/cms/users', 'POST'),
    { resource: 'users', action: 'create' }
  )
  assert.deepEqual(
    inferCmsPermissionFromPath('/api/cms/settings', 'PATCH'),
    { resource: 'settings', action: 'update' }
  )
  assert.deepEqual(
    inferCmsPermissionFromPath('/api/cms/blogs', 'GET'),
    { resource: 'blogs', action: 'read' }
  )
  assert.equal(inferCmsPermissionFromPath('/api/cms/scheduled-items', 'GET'), null)
})
