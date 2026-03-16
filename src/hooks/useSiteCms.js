import { useEffect, useState } from 'react'

const EMPTY_MENUS = {
  header: [],
  footer: [],
  bottom_dock: [],
}

export function useSiteCms() {
  const [settings, setSettings] = useState(null)
  const [menus, setMenus] = useState(EMPTY_MENUS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const res = await fetch('/api/cms/site', { cache: 'no-store' })
        const payload = await res.json()
        if (!active) return
        if (payload?.success && payload?.data) {
          setSettings(payload.data.settings || null)
          setMenus({ ...EMPTY_MENUS, ...(payload.data.menus || {}) })
        }
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

  return { settings, menus, loading }
}
