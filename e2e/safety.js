const { URL } = require('node:url')

const DEFAULT_BASE_URL = 'http://127.0.0.1:3200'
const REQUIRED_DESTRUCTIVE_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
  'E2E_ADMIN_EMAIL',
  'E2E_ADMIN_PASSWORD',
  'E2E_ALLOW_DESTRUCTIVE_CMS_TESTS',
  'E2E_TEST_PREFIX',
  'E2E_ENVIRONMENT',
  'E2E_EXPECTED_SUPABASE_PROJECT_REF',
]
const TEST_PREFIX_PATTERN = /^(?=.{8,}$)(?!test(?:$|-))(?!temp(?:$|-))(?!demo(?:$|-))[a-z0-9]+(?:-[a-z0-9]+)+$/i
const PRODUCTION_HOST_PATTERN = /(^|\.)acadvizen\.com$/i
const STAGING_ENVIRONMENT = 'staging'
const DISPOSABLE_ENVIRONMENT = 'disposable'

// Hard blocklist of confirmed-production Supabase project refs. This exists because
// E2E_ENVIRONMENT / E2E_EXPECTED_SUPABASE_PROJECT_REF are self-declared in .env files and
// only prove the CONFIGURED expectation, not the actual identity of the target project. A
// mislabeled .env.local (E2E_ENVIRONMENT=staging pointing at the real prod Supabase project)
// previously passed this gate because the host check only inspects E2E_BASE_URL/NEXT_PUBLIC_APP_URL
// (both localhost), never the Supabase project itself. Confirmed production ref:
// hhfccftkfryesjirauwf (2026-08-02) - destructive tests must never target it regardless of label.
const KNOWN_PRODUCTION_PROJECT_REFS = ['hhfccftkfryesjirauwf']

function normalizeBooleanEnv(value) {
  return typeof value === 'string' && value.trim().toLowerCase() === 'enabled'
}

function normalizeTestPrefix(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizeEnvironment(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizeProjectRef(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function isValidTestPrefix(value) {
  return TEST_PREFIX_PATTERN.test(normalizeTestPrefix(value))
}

function getBaseUrl(env = process.env) {
  return env.E2E_BASE_URL || DEFAULT_BASE_URL
}

function getAppUrl(env = process.env) {
  return env.NEXT_PUBLIC_APP_URL || ''
}

function getSupabaseUrl(env = process.env) {
  return env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || ''
}

function parseSupabaseProjectRef(value = '') {
  try {
    const parsed = new URL(String(value || '').trim())
    const hostname = String(parsed.hostname || '').toLowerCase()
    const match = hostname.match(/^([a-z0-9-]+)\.supabase\.[a-z.]+$/i)
    return match ? match[1].toLowerCase() : ''
  } catch {
    return ''
  }
}

function isLocalhostUrl(value = '') {
  try {
    const hostname = new URL(String(value || '').trim()).hostname.toLowerCase()
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
  } catch {
    return false
  }
}

function getDestructiveCmsTestConfig(env = process.env) {
  const baseUrl = getBaseUrl(env)
  const appUrl = getAppUrl(env)
  const supabaseUrl = getSupabaseUrl(env)
  const hasPublicSupabaseKey = Boolean(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const hasServiceRoleKey = Boolean(env.SUPABASE_SERVICE_ROLE_KEY)
  const hasAdminCredentials = Boolean(env.E2E_ADMIN_EMAIL && env.E2E_ADMIN_PASSWORD)
  const allowDestructive = normalizeBooleanEnv(env.E2E_ALLOW_DESTRUCTIVE_CMS_TESTS)
  const testPrefix = normalizeTestPrefix(env.E2E_TEST_PREFIX)
  const environment = normalizeEnvironment(env.E2E_ENVIRONMENT)
  const expectedProjectRef = normalizeProjectRef(env.E2E_EXPECTED_SUPABASE_PROJECT_REF)
  const targetProjectRef = parseSupabaseProjectRef(supabaseUrl)
  const isDisposableLocal = environment === DISPOSABLE_ENVIRONMENT && isLocalhostUrl(baseUrl) && isLocalhostUrl(appUrl) && isLocalhostUrl(supabaseUrl)
  const missingVarNames = []
  const reasons = []

  if (!allowDestructive) {
    missingVarNames.push('E2E_ALLOW_DESTRUCTIVE_CMS_TESTS')
    reasons.push('Set E2E_ALLOW_DESTRUCTIVE_CMS_TESTS=enabled to confirm the database is staging or disposable.')
  }

  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    missingVarNames.push('NEXT_PUBLIC_SUPABASE_URL')
    reasons.push('NEXT_PUBLIC_SUPABASE_URL must be set before destructive CMS tests can run.')
  }

  if (!hasPublicSupabaseKey) {
    missingVarNames.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    reasons.push('A browser-safe Supabase public key must be set before destructive CMS tests can run.')
  }

  if (!hasServiceRoleKey) {
    missingVarNames.push('SUPABASE_SERVICE_ROLE_KEY')
    reasons.push('SUPABASE_SERVICE_ROLE_KEY must be available server-side for destructive CMS verification.')
  }

  if (!appUrl) {
    missingVarNames.push('NEXT_PUBLIC_APP_URL')
    reasons.push('NEXT_PUBLIC_APP_URL must identify the staging application before destructive CMS tests can run.')
  }

  if (!env.E2E_ADMIN_EMAIL) {
    missingVarNames.push('E2E_ADMIN_EMAIL')
    reasons.push('E2E_ADMIN_EMAIL must be set for admin-dashboard destructive CMS tests.')
  }

  if (!env.E2E_ADMIN_PASSWORD) {
    missingVarNames.push('E2E_ADMIN_PASSWORD')
    reasons.push('E2E_ADMIN_PASSWORD must be set for admin-dashboard destructive CMS tests.')
  }

  if (!testPrefix) {
    missingVarNames.push('E2E_TEST_PREFIX')
    reasons.push('Set E2E_TEST_PREFIX to a safe unique prefix such as e2e-acadvizen.')
  } else if (!isValidTestPrefix(testPrefix)) {
    reasons.push('E2E_TEST_PREFIX must be at least 8 characters, contain only lowercase letters, numbers, and hyphens, and avoid generic prefixes such as test, temp, or demo.')
  }

  if (!environment) {
    missingVarNames.push('E2E_ENVIRONMENT')
    reasons.push('Set E2E_ENVIRONMENT=staging or E2E_ENVIRONMENT=disposable before destructive CMS tests can run.')
  } else if (![STAGING_ENVIRONMENT, DISPOSABLE_ENVIRONMENT].includes(environment)) {
    reasons.push('Destructive CMS tests are only allowed when E2E_ENVIRONMENT is staging or disposable.')
  }

  if (!expectedProjectRef && environment !== DISPOSABLE_ENVIRONMENT) {
    missingVarNames.push('E2E_EXPECTED_SUPABASE_PROJECT_REF')
    reasons.push('Set E2E_EXPECTED_SUPABASE_PROJECT_REF to the safe staging Supabase project reference before destructive CMS tests can run.')
  }

  if (supabaseUrl && !targetProjectRef && !isDisposableLocal) {
    reasons.push('Unable to parse the Supabase project reference from the configured Supabase URL.')
  } else if (!isDisposableLocal && expectedProjectRef && targetProjectRef !== expectedProjectRef) {
    reasons.push(`Configured Supabase project reference ${targetProjectRef} does not match the expected staging project reference ${expectedProjectRef}.`)
  }

  if (targetProjectRef && KNOWN_PRODUCTION_PROJECT_REFS.includes(targetProjectRef)) {
    reasons.push(`Configured Supabase project reference ${targetProjectRef} is a confirmed production project. Destructive CMS tests are permanently blocked against it regardless of E2E_ENVIRONMENT label.`)
  }

  try {
    const parsedBaseUrl = new URL(baseUrl)
    if (PRODUCTION_HOST_PATTERN.test(parsedBaseUrl.hostname)) {
      reasons.push(`Destructive CMS tests are blocked against production host ${parsedBaseUrl.hostname}.`)
    }
    if (environment === DISPOSABLE_ENVIRONMENT && !isLocalhostUrl(baseUrl)) {
      reasons.push('Disposable destructive CMS tests must run against a localhost application URL.')
    }
  } catch {
    reasons.push('E2E_BASE_URL must be a valid absolute URL before destructive CMS tests can run.')
  }

  try {
    const parsedAppUrl = new URL(appUrl)
    if (PRODUCTION_HOST_PATTERN.test(parsedAppUrl.hostname)) {
      reasons.push(`Destructive CMS tests are blocked against production application host ${parsedAppUrl.hostname}.`)
    }
    if (environment === DISPOSABLE_ENVIRONMENT && !isLocalhostUrl(appUrl)) {
      reasons.push('Disposable destructive CMS tests require NEXT_PUBLIC_APP_URL to be localhost.')
    }
  } catch {
    if (appUrl) {
      reasons.push('NEXT_PUBLIC_APP_URL must be a valid absolute URL before destructive CMS tests can run.')
    }
  }

  return {
    enabled: missingVarNames.length === 0 && reasons.length === 0,
    baseUrl,
    appUrl,
    testPrefix,
    environment,
    expectedProjectRef,
    targetProjectRef,
    isDisposableLocal,
    hasAdminCredentials,
    hasPublicSupabaseKey,
    hasServiceRoleKey,
    allowDestructive,
    missingVarNames,
    reasons,
    requiredVarNames: REQUIRED_DESTRUCTIVE_ENV_VARS,
  }
}

function getDestructiveCmsBlockMessage(env = process.env) {
  const config = getDestructiveCmsTestConfig(env)
  const missingLine = config.missingVarNames.length
    ? `Missing variables: ${config.missingVarNames.join(', ')}.`
    : 'All required destructive-test variables are present, but the target is still not considered safe.'

  return [
    'Destructive CMS E2E tests are blocked.',
    missingLine,
    ...config.reasons,
    'Use a staging or disposable Supabase project only.',
  ].join(' ')
}

function assertDestructiveCmsTestsAllowed(env = process.env) {
  const config = getDestructiveCmsTestConfig(env)
  if (!config.enabled) {
    throw new Error(getDestructiveCmsBlockMessage(env))
  }
  return config
}

function createScopedCmsValue(label = 'record', env = process.env) {
  const { testPrefix } = assertDestructiveCmsTestsAllowed(env)
  const safeLabel = String(label)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '') || 'record'

  const randomSuffix = Math.random().toString(36).slice(2, 8)
  return `${testPrefix}-${safeLabel}-${Date.now()}-${randomSuffix}`
}

module.exports = {
  DEFAULT_BASE_URL,
  KNOWN_PRODUCTION_PROJECT_REFS,
  REQUIRED_DESTRUCTIVE_ENV_VARS,
  createScopedCmsValue,
  assertDestructiveCmsTestsAllowed,
  getBaseUrl,
  getDestructiveCmsBlockMessage,
  getDestructiveCmsTestConfig,
  isValidTestPrefix,
  normalizeBooleanEnv,
  normalizeEnvironment,
  normalizeProjectRef,
  normalizeTestPrefix,
  parseSupabaseProjectRef,
}
