const fs = require('node:fs')
const path = require('node:path')
const dotenv = require('dotenv')

for (const envFile of ['.env.local', '.env.test.local', '.env']) {
  const envPath = path.join(__dirname, '..', envFile)
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false, quiet: true })
  }
}

const { getDestructiveCmsTestConfig } = require('../e2e/safety')

const config = getDestructiveCmsTestConfig(process.env)

console.log('enabled:', config.enabled)
console.log('environment:', config.environment)
console.log('baseUrl:', config.baseUrl)
console.log('appUrl:', config.appUrl)
console.log('isDisposableLocal:', config.isDisposableLocal)
console.log('targetProjectRef:', config.targetProjectRef)
console.log('expectedProjectRef:', config.expectedProjectRef)
console.log('hasAdminCredentials:', config.hasAdminCredentials)
console.log('hasServiceRoleKey:', config.hasServiceRoleKey)
console.log('missingVarNames:', JSON.stringify(config.missingVarNames))
console.log('reasons:', JSON.stringify(config.reasons))

