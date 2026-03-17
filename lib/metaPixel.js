export const META_PIXEL_ID = '701671662939654'

function getWindow() {
  return typeof window === 'undefined' ? null : window
}

function getFbq() {
  const win = getWindow()
  return win && typeof win.fbq === 'function' ? win.fbq : null
}

function currentPath() {
  const win = getWindow()
  if (!win) return ''
  return `${win.location.pathname}${win.location.search || ''}`
}

function getEventCache() {
  const win = getWindow()
  if (!win) return {}
  if (!win.__acadvizenMetaPixelEventCache) {
    win.__acadvizenMetaPixelEventCache = {}
  }
  return win.__acadvizenMetaPixelEventCache
}

function shouldSkipDuplicate(key) {
  if (!key) return false
  const cache = getEventCache()
  const now = Date.now()
  const last = cache[key]
  cache[key] = now
  return Boolean(last && now - last < 2000)
}

function trackMetaEvent(name, payload = {}, dedupeKey = '') {
  const fbq = getFbq()
  if (!fbq) return false
  if (shouldSkipDuplicate(`${name}:${dedupeKey}`)) return false
  if (payload && Object.keys(payload).length > 0) {
    fbq('track', name, payload)
  } else {
    fbq('track', name)
  }
  return true
}

export function trackPageView(path = currentPath()) {
  const fbq = getFbq()
  const win = getWindow()
  if (!fbq || !win || !path) return false
  if (win.__acadvizenMetaPixelLastPage === path) return false
  fbq('track', 'PageView')
  win.__acadvizenMetaPixelLastPage = path
  return true
}

export function trackLead(payload = {}, dedupeKey = '') {
  return trackMetaEvent('Lead', payload, dedupeKey)
}

export function trackContact(payload = {}, dedupeKey = '') {
  return trackMetaEvent('Contact', payload, dedupeKey)
}

