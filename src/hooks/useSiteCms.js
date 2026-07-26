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

export function useSiteCms() {
  const [settings, setSettings] = useState(null)
  const [menus, setMenus] = useState(EMPTY_MENUS)
  const [headerSettings, setHeaderSettings] = useState(null)
  const [footerSettings, setFooterSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [siteRes, headerRes, footerRes] = await Promise.all([
          fetch('/api/cms/site', { cache: 'no-store' }),
          fetchHeaderSettings(),
          fetchFooterSettings(),
        ])

        const sitePayload = await siteRes.json()
        if (!active) return

        if (sitePayload?.success && sitePayload?.data) {
          setSettings(sitePayload.data.settings || null)
          setMenus({ ...EMPTY_MENUS, ...(sitePayload.data.menus || {}) })
        }

        setHeaderSettings(headerRes)
        setFooterSettings(footerRes)
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
  }, [])

  return { settings, menus, headerSettings, footerSettings, loading }
}
