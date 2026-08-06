/**
 * Server-side counterpart of `src/hooks/useSiteCms.js`.
 *
 * The public layout used to fetch header/footer/site-settings/locations with four
 * client-side `fetch()` calls *after* the page had already rendered (see useSiteCms),
 * which meant every public navigation paid for an extra client-server round trip and a
 * visible flash of default header/footer content. This module fetches the exact same
 * data server-side, in parallel, during the initial render pass so it can be handed to
 * `PublicLayout` as props instead - eliminating that round trip entirely for the
 * (public) route group and the homepage.
 */
import { getServerSupabaseClient } from './supabaseServer'

const EMPTY_MENUS = {
  header: [],
  footer: [],
  bottom_dock: [],
}

async function fetchSiteSettingsAndMenus(supabase) {
  try {
    const { data: settings, error: settingsError } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle()

    if (settingsError) return { settings: null, menus: EMPTY_MENUS }

    const { data: menus, error: menusError } = await supabase
      .from('menus')
      .select('*')
      .eq('is_active', true)
      .eq('status', 'published')
      .order('menu_location', { ascending: true })
      .order('order_index', { ascending: true })

    if (menusError) {
      return { settings: settings || null, menus: EMPTY_MENUS }
    }

    let navMenus = []
    try {
      const { data: navData, error: navError } = await supabase
        .from('navigation_menus')
        .select('*')
        .eq('is_active', true)
        .order('location', { ascending: true })
        .order('order_index', { ascending: true })
      if (!navError && Array.isArray(navData)) navMenus = navData
    } catch {
      // navigation_menus is optional
    }

    const menuSource = Array.isArray(menus) && menus.length
      ? menus.map((item) => ({ ...item, menu_location: item.menu_location || 'header' }))
      : (Array.isArray(navMenus) ? navMenus.map((item) => ({ ...item, menu_location: item.location || 'header' })) : [])

    const groupedMenus = menuSource.reduce((acc, item) => {
      const key = item.menu_location || 'header'
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, { ...EMPTY_MENUS })

    return { settings: settings || null, menus: groupedMenus }
  } catch {
    return { settings: null, menus: EMPTY_MENUS }
  }
}

async function fetchHeaderSettingsRow(supabase) {
  try {
    const { data, error } = await supabase
      .from('header_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) return null
    return data || null
  } catch {
    return null
  }
}

async function fetchFooterSettingsRow(supabase) {
  try {
    const { data, error } = await supabase
      .from('footer_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) return null
    return data || null
  } catch {
    return null
  }
}

async function fetchLocationsRows(supabase) {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name', { ascending: true })
    if (error || !Array.isArray(data)) return []
    return data
  } catch {
    return []
  }
}

/**
 * Fetches everything `PublicLayout` needs (site settings, menus, header settings,
 * footer settings, locations) in a single parallel batch. Safe to call from any
 * Server Component; every sub-fetch degrades to a safe empty/null default on failure
 * so PublicLayout's own fallback values still apply.
 */
export async function fetchSiteCmsData() {
  const supabase = getServerSupabaseClient()
  if (!supabase) {
    return {
      settings: null,
      menus: EMPTY_MENUS,
      headerSettings: null,
      footerSettings: null,
      locations: [],
    }
  }

  const [{ settings, menus }, headerSettings, footerSettings, locations] = await Promise.all([
    fetchSiteSettingsAndMenus(supabase),
    fetchHeaderSettingsRow(supabase),
    fetchFooterSettingsRow(supabase),
    fetchLocationsRows(supabase),
  ])

  return { settings, menus, headerSettings, footerSettings, locations }
}
