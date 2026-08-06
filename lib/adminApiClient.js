import { ensureBrowserSupabaseClient } from './supabaseBrowser'
import { sessionManager } from './sessionManager'

const DEFAULT_TIMEOUT_MS = 15000

function createAdminApiError(message, options = {}) {
  const error = new Error(message)
  error.name = options.transient
    ? 'TransientAdminApiError'
    : options.authentication
      ? 'AdminAuthError'
      : 'AdminApiError'
  error.status = options.status || 0
  error.transient = !!options.transient
  error.authentication = !!options.authentication
  return error
}

function isTransientStatus(status) {
  return status === 408 || status === 425 || status === 429 || status >= 500
}

function isAuthenticationStatus(status) {
  return status === 401 || status === 403
}

function isTransientError(error) {
  if (!error) return false
  if (error.transient) return true
  if (error.name === 'AbortError') return true
  const message = String(error.message || '').toLowerCase()
  return (
    message.includes('timed out') ||
    message.includes('timeout') ||
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('failed to fetch') ||
    message.includes('econnrefused') ||
    message.includes('etimedout') ||
    message.includes('enotfound') ||
    message.includes('abort') ||
    message.includes('signal') ||
    message.includes('temporarily unavailable')
  )
}

function getRetryDelay(attempt) {
  const base = Math.min(1000 * Math.pow(2, Math.max(0, attempt - 1)), 8000)
  return base + Math.floor(Math.random() * base * 0.25)
}

// On a freshly-loaded page (a full reload, not an SPA transition), the browser Supabase client
// singleton is recreated from scratch and its restoration of a persisted session from storage
// is genuinely asynchronous - a component can mount and ask for a token before that read has
// landed. AdminLayoutClient's own access gate already proves a valid session exists
// server-side (via the admin cookie) before it allows any child component to mount, so a
// client-side session materializing a few hundred ms late here is expected, not a real
// absence. This bounded retry only engages when no session is found at all; it adds zero
// latency on the normal path where the session is already present.
const SESSION_BOOTSTRAP_RETRY_DELAYS_MS = [150, 350, 600]

async function getAccessTokenState(options = {}) {
  const {
    allowRefresh = true,
  } = options
  const supabase = await ensureBrowserSupabaseClient()
  if (!supabase?.auth) {
    return { token: '', transient: false }
  }

  const refreshed = allowRefresh
    ? await sessionManager.refreshIfNeeded()
    : false

  try {
    let session = (await supabase.auth.getSession()).data?.session

    for (let attempt = 0; !session && attempt < SESSION_BOOTSTRAP_RETRY_DELAYS_MS.length; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, SESSION_BOOTSTRAP_RETRY_DELAYS_MS[attempt]))
      session = (await supabase.auth.getSession()).data?.session
    }

    if (session?.access_token) {
      return { token: session.access_token, transient: false }
    }

    if (session?.refresh_token || refreshed) {
      const { data: refreshedData, error } = await supabase.auth.refreshSession()
      if (error) {
        return { token: '', transient: isTransientError(error), error }
      }
      return { token: refreshedData?.session?.access_token || '', transient: false }
    }

    return { token: '', transient: false }
  } catch (error) {
    return { token: '', transient: isTransientError(error), error }
  }
}

async function getAccessToken() {
  const { token } = await getAccessTokenState()
  return token
}

export async function getAdminAccessToken() {
  return getAccessToken()
}

async function parseJsonResponse(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(text || 'Server returned an invalid response.')
  }
}

async function fetchWithTimeout(url, request, timeoutMs) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...request,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function adminApiFetch(url, options = {}) {
  const {
    method = 'GET',
    body,
    headers,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = String(method).toUpperCase() === 'GET' ? 2 : 1,
    requireAuth = true,
    cache = 'no-store',
  } = options

  const baseHeaders = new Headers(headers || {})
  let requestBody = body

  if (
    body !== undefined &&
    body !== null &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    typeof body === 'object'
  ) {
    if (!baseHeaders.has('Content-Type')) {
      baseHeaders.set('Content-Type', 'application/json')
    }
    requestBody = JSON.stringify(body)
  }

  async function attempt(remainingRetries) {
    try {
      const requestHeaders = new Headers(baseHeaders)

      if (requireAuth) {
        const tokenState = await getAccessTokenState()
        if (!tokenState.token) {
          throw createAdminApiError(
            tokenState.transient
              ? 'Admin session is temporarily unavailable. Please retry.'
              : 'Admin session expired. Please sign in again.',
            {
              transient: tokenState.transient,
              authentication: !tokenState.transient,
              status: tokenState.transient ? 503 : 401,
            }
          )
        }
        requestHeaders.set('Authorization', `Bearer ${tokenState.token}`)
      }

      const response = await fetchWithTimeout(
        url,
        {
          method,
          headers: requestHeaders,
          body: requestBody,
          cache,
        },
        timeoutMs
      )

      const payload = await parseJsonResponse(response)
      if (!response.ok || payload?.success === false) {
        const message = payload?.error || `Request failed with status ${response.status}.`
        throw createAdminApiError(message, {
          status: response.status,
          transient: isTransientStatus(response.status),
          authentication: isAuthenticationStatus(response.status),
        })
      }

      return payload
    } catch (error) {
      if (isTransientError(error) && remainingRetries > 0) {
        const attemptNumber = retries - remainingRetries + 1
        await new Promise((resolve) => setTimeout(resolve, getRetryDelay(attemptNumber)))
        return attempt(remainingRetries - 1)
      }

      if (error?.name === 'AbortError') {
        throw createAdminApiError('Request timed out. Please try again.', {
          transient: true,
          status: 503,
        })
      }

      throw error
    }
  }

  return attempt(retries)
}

export async function fetchAdminSession() {
  const tokenState = await getAccessTokenState({ allowRefresh: false })
  const headers = {}

  if (tokenState.token) {
    headers.Authorization = `Bearer ${tokenState.token}`
  }

  return adminApiFetch('/api/admin/session', {
    cache: 'no-store',
    requireAuth: false,
    headers,
  })
}
