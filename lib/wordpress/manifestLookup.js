/**
 * The Render Bridge manifest as the middleware sees it, with bounded waiting (pure; no Next.js imports).
 *
 * Every public page request asks which addresses WordPress serves. That answer must never hold a page
 * up: a lookup that takes longer than `timeoutMs` is abandoned and the request continues with the last
 * known manifest (or none, which serves Main's own page). A good answer is reused for `ttlMs`; a failed
 * or slow one for `failureTtlMs`, so a struggling WordPress is not asked again by every request.
 * Requests that arrive while a lookup is running share it. One immediate retry covers a new instance
 * whose manifest route is still starting up, but never follows a timeout.
 */
export const MANIFEST_TTL_MS = 30_000
export const MANIFEST_FAILURE_TTL_MS = 10_000
export const MANIFEST_TIMEOUT_MS = 2_500

/**
 * @param {object} options
 * @param {(signal: AbortSignal) => Promise<object|null>} options.load fetches the manifest (null = none)
 * @param {() => number} [options.now]
 */
export function createManifestLookup({ load, now = () => Date.now(), ttlMs = MANIFEST_TTL_MS, failureTtlMs = MANIFEST_FAILURE_TTL_MS, timeoutMs = MANIFEST_TIMEOUT_MS }) {
  let memo = { at: 0, ok: false, value: null }
  let pending = null

  const attempt = async () => {
    const controller = new AbortController()
    let timer
    const timedOut = new Promise((resolve) => { timer = setTimeout(() => { controller.abort(); resolve({ value: null, timedOut: true }) }, timeoutMs) })
    const loaded = Promise.resolve()
      .then(() => load(controller.signal))
      .then((value) => ({ value: value || null, timedOut: false }), () => ({ value: null, timedOut: false }))
    try {
      return await Promise.race([loaded, timedOut])
    } finally {
      clearTimeout(timer)
    }
  }

  return function lookup() {
    if (memo.at && now() - memo.at < (memo.ok ? ttlMs : failureTtlMs)) return Promise.resolve(memo.value)
    if (!pending) {
      pending = (async () => {
        let result = await attempt()
        if (!result.value && !result.timedOut) result = await attempt()
        memo = result.value ? { at: now(), ok: true, value: result.value } : { at: now(), ok: false, value: memo.value }
        return memo.value
      })().finally(() => { pending = null })
    }
    return pending
  }
}
