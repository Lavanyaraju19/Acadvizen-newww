/**
 * Retry policy for the Render Bridge's page fetch (pure; see lib/wordpress/bridge.js).
 */
const RETRY_DELAY_MS = 1500
const RETRY_IF_FAILED_WITHIN_MS = 4000

/**
 * Runs `attempt(timeoutMs)` and retries it once when it failed quickly: WordPress refused it (HTTP 5xx) or the
 * connection failed within RETRY_IF_FAILED_WITHIN_MS. A busy WordPress (many pages redrawn at once) refuses
 * some requests at once; right after a publication Main has no cached copy of that page yet, so the visitor
 * saw "temporarily unavailable" (production, 26 Oct 2026: 2 of about 1,300 requests during a site-wide
 * redraw). A slow failure (a timeout) is not retried; the second attempt keeps to the same time budget.
 */
export async function withOneQuickRetry(attempt, { budgetMs = 10000, delayMs = RETRY_DELAY_MS, now = Date.now, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  const started = now()
  try {
    return await attempt(budgetMs)
  } catch (error) {
    const elapsed = now() - started
    const quick = (error?.status >= 500 && error?.status <= 599) || (!error?.status && elapsed < RETRY_IF_FAILED_WITHIN_MS && !/timed out/.test(error?.message || ''))
    const left = budgetMs - elapsed - delayMs
    if (!quick || left < 2000) throw error
    await sleep(delayMs)
    return attempt(left)
  }
}
