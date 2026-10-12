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
import { groupMenuRows } from './menuTree'
import { fetchSiteSettingsAndMenus } from './siteMenus.js'

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
      menus: groupMenuRows([]),
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
