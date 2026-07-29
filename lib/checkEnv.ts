/**
 * Environment validation for production.
 * 
 * Call this at application startup to ensure all required
 * environment variables are configured.
 * 
 * Usage:
 *   import { checkEnv } from './lib/checkEnv'
 *   checkEnv()
 */

import { validateAllEnv } from './env'

export function checkEnv(): void {
  const errors = validateAllEnv()

  if (errors.length > 0) {
    const critical = errors.filter((e) => !e.includes('recommended'))
    if (critical.length > 0) {
      throw new Error(
        '❌ Environment configuration errors:\n' +
        critical.map((e) => `   - ${e}`).join('\n') +
        '\n\nPlease configure these in .env.local or your hosting environment variables.'
      )
    }
  }
}

