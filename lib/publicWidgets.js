// Shared client-side helpers for public-facing CMS widgets (banners, popups)
// that must respect admin-configured scheduling, page targeting, and device targeting.

export function isWithinDateWindow(startDate, endDate, now = new Date()) {
  const nowMs = now.getTime()
  if (startDate && new Date(startDate).getTime() > nowMs) return false
  if (endDate && new Date(endDate).getTime() < nowMs) return false
  return true
}

function normalizePathPattern(pattern) {
  return String(pattern || '').trim()
}

export function pathMatchesPattern(pathname, pattern) {
  const p = normalizePathPattern(pattern)
  if (!p) return false
  if (p === '*' || p === '/*') return true
  if (p === pathname) return true
  if (p.endsWith('/*')) {
    const prefix = p.slice(0, -2)
    return pathname === prefix || pathname.startsWith(`${prefix}/`)
  }
  return false
}

// Empty target list means "all pages". Exclude list always wins over target list.
export function matchesPageTargeting(pathname, targetPages = [], excludePages = []) {
  const excludes = Array.isArray(excludePages) ? excludePages : []
  if (excludes.some((pattern) => pathMatchesPattern(pathname, pattern))) return false
  const targets = Array.isArray(targetPages) ? targetPages : []
  if (!targets.length) return true
  return targets.some((pattern) => pathMatchesPattern(pathname, pattern))
}

export function getDeviceType() {
  if (typeof window === 'undefined') return 'desktop'
  const width = window.innerWidth
  if (width < 640) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

export function bannerDeviceEnabled(banner, deviceType = getDeviceType()) {
  const targeting = banner?.device_targeting && typeof banner.device_targeting === 'object' ? banner.device_targeting : null
  if (!targeting) return true
  return targeting[deviceType] !== false
}

export function popupDeviceEnabled(popup, deviceType = getDeviceType()) {
  if (deviceType === 'mobile') return popup?.mobile_enabled !== false
  if (deviceType === 'tablet') return popup?.tablet_enabled !== false
  return popup?.desktop_enabled !== false
}

const FREQUENCY_KEY_PREFIX = 'acadvizen_popup_seen_'

export function popupFrequencyAllows(popup) {
  if (typeof window === 'undefined' || !popup?.id) return false
  const key = `${FREQUENCY_KEY_PREFIX}${popup.id}`
  const frequency = popup.show_frequency || 'session'

  if (frequency === 'always') return true

  if (frequency === 'session') {
    return sessionStorage.getItem(key) !== '1'
  }

  if (frequency === 'once_per_visitor') {
    return localStorage.getItem(key) !== '1'
  }

  if (frequency === 'custom') {
    const lastSeen = Number(localStorage.getItem(key) || 0)
    if (!lastSeen) return true
    const days = Number(popup.custom_frequency_days) || 7
    return Date.now() - lastSeen > days * 24 * 60 * 60 * 1000
  }

  return true
}

export function markPopupSeen(popup) {
  if (typeof window === 'undefined' || !popup?.id) return
  const key = `${FREQUENCY_KEY_PREFIX}${popup.id}`
  const frequency = popup.show_frequency || 'session'
  if (frequency === 'session') sessionStorage.setItem(key, '1')
  else if (frequency === 'once_per_visitor') localStorage.setItem(key, '1')
  else if (frequency === 'custom') localStorage.setItem(key, String(Date.now()))
}

export function isBannerEligible(banner, { pathname, deviceType = getDeviceType(), now = new Date() } = {}) {
  if (!banner) return false
  if (!isWithinDateWindow(banner.start_date, banner.end_date, now)) return false
  if (!bannerDeviceEnabled(banner, deviceType)) return false
  if (!matchesPageTargeting(pathname, banner.page_targeting, [])) return false
  return true
}

export function isPopupEligible(popup, { pathname, deviceType = getDeviceType(), now = new Date() } = {}) {
  if (!popup) return false
  if (!isWithinDateWindow(popup.start_date, popup.end_date, now)) return false
  if (!popupDeviceEnabled(popup, deviceType)) return false
  if (!matchesPageTargeting(pathname, popup.target_pages, popup.exclude_pages)) return false
  if (!popupFrequencyAllows(popup)) return false
  return true
}
