/**
 * Minimal JSON client for the acadvizen-cms/v1 API (server-side only).
 */

export const WORDPRESS_TIMEOUT_MS = 5000

export class WordPressRequestError extends Error {
  constructor(message, { status = 0, path = '' } = {}) {
    super(message)
    this.name = 'WordPressRequestError'
    this.status = status
    this.path = path
  }
}

/**
 * @returns {Promise<{status: number, data: any, headers: Headers}>}
 *   404 is returned (not thrown) so callers can treat "not found" as a real answer.
 *   Network errors, timeouts, 5xx and invalid JSON throw, so callers never cache a failure.
 */
export async function wordpressGetJson(config, path, { timeoutMs = WORDPRESS_TIMEOUT_MS, fetchImpl = fetch, headers = {} } = {}) {
  if (!config?.apiUrl) throw new WordPressRequestError('WordPress API URL is not configured', { path })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(`${config.apiUrl}${path}`, {
      headers: { Accept: 'application/json', ...headers },
      cache: 'no-store',
      redirect: 'error',
      signal: controller.signal,
    })
    if (response.status === 404) return { status: 404, data: null, headers: response.headers }
    if (!response.ok) throw new WordPressRequestError(`WordPress responded ${response.status}`, { status: response.status, path })
    return { status: response.status, data: await response.json(), headers: response.headers }
  } catch (error) {
    if (error instanceof WordPressRequestError) throw error
    const reason = error?.name === 'AbortError' ? `timed out after ${timeoutMs}ms` : error?.message || 'request failed'
    throw new WordPressRequestError(`WordPress request failed: ${reason}`, { path })
  } finally {
    clearTimeout(timer)
  }
}
