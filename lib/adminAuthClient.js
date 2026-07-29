import { ensureBrowserSupabaseClient, ensureBrowserSupabaseConfig } from './supabaseClient'

function createAdminAuthError(message, status = 0) {
  const error = new Error(message)
  error.name = 'AdminAuthError'
  error.status = status
  return error
}

async function parseResponse(response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    throw createAdminAuthError('Server returned an invalid response.', response.status)
  }
}

async function cleanupFailedAdminLogin(client) {
  try {
    await client?.auth?.signOut({ scope: 'local' })
  } catch {
    // Ignore cleanup failures.
  }

  try {
    await fetch('/api/admin/session', { method: 'DELETE' })
  } catch {
    // Ignore cleanup failures.
  }
}

export async function signInAdminWithPassword(email, password) {
  const config = await ensureBrowserSupabaseConfig()
  const client = config ? await ensureBrowserSupabaseClient() : null

  if (!client?.auth || !config?.url || !config?.anonKey) {
    throw createAdminAuthError('Supabase configuration is unavailable. Contact support if this persists.')
  }

  await client.auth.signOut({ scope: 'local' })

  const response = await fetch('/api/admin/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email.trim(),
      password: password.trim(),
    }),
    cache: 'no-store',
  })

  const payload = await parseResponse(response)
  if (!response.ok || payload?.success === false) {
    throw createAdminAuthError(
      payload?.error || 'Unable to sign in.',
      response.status
    )
  }

  const accessToken = payload?.data?.session?.accessToken || ''
  const refreshToken = payload?.data?.session?.refreshToken || ''

  if (!accessToken || !refreshToken) {
    throw createAdminAuthError('Unable to verify account. Please try again.', 500)
  }

  try {
    await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    const sessionResponse = await fetch('/api/admin/session', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    })

    const sessionPayload = await parseResponse(sessionResponse)
    if (!sessionResponse.ok || sessionPayload?.success === false) {
      await cleanupFailedAdminLogin(client)
      throw createAdminAuthError(
        sessionPayload?.error || 'Unable to initialize your admin session. Please try again.',
        sessionResponse.status || 500
      )
    }
  } catch (error) {
    await cleanupFailedAdminLogin(client)

    throw createAdminAuthError(
      error?.message || 'Unable to initialize your session. Please try again.',
      500
    )
  }

  return payload?.data || null
}
