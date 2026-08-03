import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  createScopedCmsValue,
  getDestructiveCmsBlockMessage,
  getDestructiveCmsTestConfig,
  isValidTestPrefix,
} = require('../../e2e/safety.js')

test('isValidTestPrefix accepts only safe e2e prefixes', () => {
  assert.equal(isValidTestPrefix('e2e-acadvizen'), true)
  assert.equal(isValidTestPrefix('acadvizen-e2e'), true)
  assert.equal(isValidTestPrefix('E2E-stage-01'), true)
  assert.equal(isValidTestPrefix('acadvizen'), false)
  assert.equal(isValidTestPrefix('test-e2e-suite'), false)
  assert.equal(isValidTestPrefix('e2e bad'), false)
})

test('getDestructiveCmsTestConfig blocks missing or unsafe destructive-test configuration', () => {
  const missingConfig = getDestructiveCmsTestConfig({
    E2E_BASE_URL: 'http://127.0.0.1:3200',
  })
  assert.equal(missingConfig.enabled, false)
  assert.deepEqual(
    missingConfig.missingVarNames,
    [
      'E2E_ALLOW_DESTRUCTIVE_CMS_TESTS',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_APP_URL',
      'E2E_ADMIN_EMAIL',
      'E2E_ADMIN_PASSWORD',
      'E2E_TEST_PREFIX',
      'E2E_ENVIRONMENT',
      'E2E_EXPECTED_SUPABASE_PROJECT_REF',
    ]
  )

  const productionTarget = getDestructiveCmsTestConfig({
    E2E_BASE_URL: 'https://acadvizen.com',
    NEXT_PUBLIC_APP_URL: 'https://staging.acadvizen.test',
    E2E_ALLOW_DESTRUCTIVE_CMS_TESTS: 'enabled',
    E2E_TEST_PREFIX: 'e2e-acadvizen',
    E2E_ENVIRONMENT: 'staging',
    E2E_EXPECTED_SUPABASE_PROJECT_REF: 'staging-ref',
    NEXT_PUBLIC_SUPABASE_URL: 'https://staging-ref.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    E2E_ADMIN_EMAIL: 'admin@example.com',
    E2E_ADMIN_PASSWORD: 'password',
  })
  assert.equal(productionTarget.enabled, false)
  assert.equal(
    productionTarget.reasons.some((reason) => reason.includes('production host acadvizen.com')),
    true
  )
})

test('getDestructiveCmsTestConfig blocks mismatched Supabase project references', () => {
  const config = getDestructiveCmsTestConfig({
    E2E_BASE_URL: 'http://127.0.0.1:3200',
    NEXT_PUBLIC_APP_URL: 'https://staging.acadvizen.test',
    E2E_ALLOW_DESTRUCTIVE_CMS_TESTS: 'enabled',
    E2E_TEST_PREFIX: 'acadvizen-e2e',
    E2E_ENVIRONMENT: 'staging',
    E2E_EXPECTED_SUPABASE_PROJECT_REF: 'staging-safe-ref',
    NEXT_PUBLIC_SUPABASE_URL: 'https://different-ref.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    E2E_ADMIN_EMAIL: 'admin@example.com',
    E2E_ADMIN_PASSWORD: 'password',
  })

  assert.equal(config.enabled, false)
  assert.equal(config.targetProjectRef, 'different-ref')
  assert.equal(
    config.reasons.some((reason) => reason.includes('does not match the expected staging project reference')),
    true
  )
})

test('createScopedCmsValue produces prefixed disposable identifiers', () => {
  const value = createScopedCmsValue('blog-post', {
    E2E_BASE_URL: 'http://127.0.0.1:3200',
    NEXT_PUBLIC_APP_URL: 'https://staging.acadvizen.test',
    E2E_ALLOW_DESTRUCTIVE_CMS_TESTS: 'enabled',
    E2E_TEST_PREFIX: 'acadvizen-e2e',
    E2E_ENVIRONMENT: 'staging',
    E2E_EXPECTED_SUPABASE_PROJECT_REF: 'staging-safe-ref',
    NEXT_PUBLIC_SUPABASE_URL: 'https://staging-safe-ref.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    E2E_ADMIN_EMAIL: 'admin@example.com',
    E2E_ADMIN_PASSWORD: 'password',
  })

  assert.match(value, /^acadvizen-e2e-blog-post-\d+-[a-z0-9]{6}$/)
  assert.equal(
    getDestructiveCmsBlockMessage({
      E2E_BASE_URL: 'http://127.0.0.1:3200',
    }).includes('Destructive CMS E2E tests are blocked.'),
    true
  )
})

test('getDestructiveCmsTestConfig blocks production NEXT_PUBLIC_APP_URL and requires exact opt-in', () => {
  const config = getDestructiveCmsTestConfig({
    E2E_BASE_URL: 'http://127.0.0.1:3200',
    NEXT_PUBLIC_APP_URL: 'https://acadvizen.com',
    E2E_ALLOW_DESTRUCTIVE_CMS_TESTS: 'true',
    E2E_TEST_PREFIX: 'acadvizen-e2e',
    E2E_ENVIRONMENT: 'staging',
    E2E_EXPECTED_SUPABASE_PROJECT_REF: 'staging-safe-ref',
    NEXT_PUBLIC_SUPABASE_URL: 'https://staging-safe-ref.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'public-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    E2E_ADMIN_EMAIL: 'admin@example.com',
    E2E_ADMIN_PASSWORD: 'password',
  })

  assert.equal(config.enabled, false)
  assert.equal(config.allowDestructive, false)
  assert.equal(
    config.reasons.some((reason) => reason.includes('production application host acadvizen.com')),
    true
  )
})

test('getDestructiveCmsTestConfig allows explicit disposable localhost targets', () => {
  const config = getDestructiveCmsTestConfig({
    E2E_BASE_URL: 'http://127.0.0.1:3200',
    NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3200',
    E2E_ALLOW_DESTRUCTIVE_CMS_TESTS: 'enabled',
    E2E_TEST_PREFIX: 'acadvizen-e2e',
    E2E_ENVIRONMENT: 'disposable',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:55321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    E2E_ADMIN_EMAIL: 'admin@example.com',
    E2E_ADMIN_PASSWORD: 'password',
  })

  assert.equal(config.enabled, true)
  assert.equal(config.isDisposableLocal, true)
})
