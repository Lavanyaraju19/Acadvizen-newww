const { URL } = require('node:url')

const DEFAULT_BASE_URL = 'http://127.0.0.1:3200'
const REQUIRED_DESTRUCTIVE_ENV_VARS = [
  'E2E_ALLOW_DESTRUCTIVE_CMS_TESTS',
  'E2E_TEST_PREFIX',
  'E2E_ENVIRONMENT',
  'E2E_EXPECTED_SUPABASE_PROJECT_REF',
]
const TEST_PREFIX_PATTERN = /^(?=.{8,}$)(?!test(?:$|-))(?!temp(?:$|-))(?!demo(?:$|-))[a-z0-9]+(?:-[a-z0-9]+)+$/i
const PRODUCTION_HOST_PATTERN = /(^|\.)acadvizen\.com$/i
const STAGING_ENVIRONMENT = 'staging'

function normalizeBooleanEnv(value) {
  return typeof value === 'string' && value.trim().toLowerCase() === 'true'
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

function getDestructiveCmsTestConfig(env = process.env) {
  const baseUrl = getBaseUrl(env)
  const supabaseUrl = getSupabaseUrl(env)
  const allowDestructive = normalizeBooleanEnv(env.E2E_ALLOW_DESTRUCTIVE_CMS_TESTS)
  const testPrefix = normalizeTestPrefix(env.E2E_TEST_PREFIX)
  const environment = normalizeEnvironment(env.E2E_ENVIRONMENT)
  const expectedProjectRef = normalizeProjectRef(env.E2E_EXPECTED_SUPABASE_PROJECT_REF)
  const targetProjectRef = parseSupabaseProjectRef(supabaseUrl)
  const missingVarNames = []
  const reasons = []

  if (!allowDestructive) {
    missingVarNames.push('E2E_ALLOW_DESTRUCTIVE_CMS_TESTS')
    reasons.push('Set E2E_ALLOW_DESTRUCTIVE_CMS_TESTS=true to confirm the database is staging or disposable.')
  }

  if (!testPrefix) {
    missingVarNames.push('E2E_TEST_PREFIX')
    reasons.push('Set E2E_TEST_PREFIX to a safe unique prefix such as e2e-acadvizen.')
  } else if (!isValidTestPrefix(testPrefix)) {
    reasons.push('E2E_TEST_PREFIX must be at least 8 characters, contain only lowercase letters, numbers, and hyphens, and avoid generic prefixes such as test, temp, or demo.')
  }

  if (!environment) {
    missingVarNames.push('E2E_ENVIRONMENT')
    reasons.push('Set E2E_ENVIRONMENT=staging before destructive CMS tests can run.')
  } else if (environment !== STAGING_ENVIRONMENT) {
    reasons.push('Destructive CMS tests are only allowed when E2E_ENVIRONMENT=staging.')
  }

  if (!expectedProjectRef) {
    missingVarNames.push('E2E_EXPECTED_SUPABASE_PROJECT_REF')
    reasons.push('Set E2E_EXPECTED_SUPABASE_PROJECT_REF to the safe staging Supabase project reference before destructive CMS tests can run.')
  }

  if (!supabaseUrl) {
    reasons.push('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL must be set before destructive CMS tests can run.')
  } else if (!targetProjectRef) {
    reasons.push('Unable to parse the Supabase project reference from the configured Supabase URL.')
  } else if (expectedProjectRef && targetProjectRef !== expectedProjectRef) {
    reasons.push(`Configured Supabase project reference ${targetProjectRef} does not match the expected staging project reference ${expectedProjectRef}.`)
  }

  try {
    const parsedBaseUrl = new URL(baseUrl)
    if (PRODUCTION_HOST_PATTERN.test(parsedBaseUrl.hostname)) {
      reasons.push(`Destructive CMS tests are blocked against production host ${parsedBaseUrl.hostname}.`)
    }
  } catch {
    reasons.push('E2E_BASE_URL must be a valid absolute URL before destructive CMS tests can run.')
  }

  return {
    enabled: missingVarNames.length === 0 && reasons.length === 0,
    baseUrl,
    testPrefix,
    environment,
    expectedProjectRef,
    targetProjectRef,
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
