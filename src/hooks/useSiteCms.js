import { useEffect, useState } from 'react'

const EMPTY_MENUS = {
  header: [],
  footer: [],
  bottom_dock: [],
}

async function fetchHeaderSettings() {
  try {
    const res = await fetch('/api/cms/header', { cache: 'no-store' })
    const payload = await res.json()
    if (payload?.success && payload?.data) {
      return payload.data
    }
    return null
  } catch {
    return null
  }
}

async function fetchFooterSettings() {
  try {
    const res = await fetch('/api/cms/footer', { cache: 'no-store' })
    const payload = await res.json()
    if (payload?.success && payload?.data) {
      return payload.data
    }
    return null
  } catch {
    return null
  }
}

async function fetchLocations() {
  try {
    const res = await fetch('/api/locations', { cache: 'no-store' })
    const payload = await res.json()
    if (payload?.success && Array.isArray(payload.data)) {
      return payload.data
    }
    return []
  } catch {
    return []
  }
}

export function useSiteCms(initialData = null) {
  const hasInitialData = Boolean(initialData)
  const [settings, setSettings] = useState(initialData?.settings ?? null)
  const [menus, setMenus] = useState(initialData?.menus ? { ...EMPTY_MENUS, ...initialData.menus } : EMPTY_MENUS)
  const [headerSettings, setHeaderSettings] = useState(initialData?.headerSettings ?? null)
  const [footerSettings, setFooterSettings] = useState(initialData?.footerSettings ?? null)
  const [locations, setLocations] = useState(Array.isArray(initialData?.locations) ? initialData.locations : [])
  const [loading, setLoading] = useState(!hasInitialData)

  useEffect(() => {
    // The server already fetched this data (see lib/siteCmsServer.js) and it was passed
    // in as initialData - re-fetching it client-side would just duplicate the same four
    // requests on every navigation for no benefit.
    if (hasInitialData) return undefined

    let active = true

    async function load() {
      try {
        const [siteRes, headerRes, footerRes, locationsRes] = await Promise.all([
          fetch('/api/cms/site', { cache: 'no-store' }),
          fetchHeaderSettings(),
          fetchFooterSettings(),
          fetchLocations(),
        ])

        const sitePayload = await siteRes.json()
        if (!active) return

        if (sitePayload?.success && sitePayload?.data) {
          setSettings(sitePayload.data.settings || null)
          setMenus({ ...EMPTY_MENUS, ...(sitePayload.data.menus || {}) })
        }

        setHeaderSettings(headerRes)
        setFooterSettings(footerRes)
        setLocations(Array.isArray(locationsRes) ? locationsRes : [])
      } catch {
        // Keep fallback defaults on network failure.
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
    // Intentionally mount-once: initialData is only meant to be evaluated on first render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { settings, menus, headerSettings, footerSettings, locations, loading }
}
