import { supabase } from './supabaseClient'

const DEFAULT_TIMEOUT_MS = 15000

function withTimeout(promise, timeoutMs, message) {
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })
}

async function getAccessToken() {
  if (!supabase?.auth) return ''
  const {
    data: { session },
  } = await withTimeout(supabase.auth.getSession(), 7000, 'Session lookup timed out.')
  return session?.access_token || ''
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

export async function adminApiFetch(url, options = {}) {
  const {
    method = 'GET',
    body,
    headers,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = String(method).toUpperCase() === 'GET' ? 1 : 0,
    requireAuth = true,
    cache = 'no-store',
  } = options

  const requestHeaders = new Headers(headers || {})
  let requestBody = body

  if (
    body !== undefined &&
    body !== null &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    typeof body === 'object'
  ) {
    if (!requestHeaders.has('Content-Type')) {
      requestHeaders.set('Content-Type', 'application/json')
    }
    requestBody = JSON.stringify(body)
  }

  if (requireAuth) {
    const accessToken = await getAccessToken()
    if (!accessToken) {
      throw new Error('Admin session expired. Please sign in again.')
    }
    requestHeaders.set('Authorization', `Bearer ${accessToken}`)
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
      cache,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const payload = await parseJsonResponse(response)
    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.error || `Request failed with status ${response.status}.`)
    }
    return payload
  } catch (error) {
    const shouldRetry =
      retries > 0 &&
      (error?.name === 'AbortError' ||
        String(error?.message || '').toLowerCase().includes('timed out') ||
        String(error?.message || '').toLowerCase().includes('network'))

    if (shouldRetry) {
      return adminApiFetch(url, {
        ...options,
        retries: retries - 1,
      })
    }

    if (error?.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }

    throw error
  }
}

export async function fetchAdminSession() {
  return adminApiFetch('/api/admin/session', { cache: 'no-store' })
}
