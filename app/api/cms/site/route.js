import { getSupabaseClientOrResponse, jsonError, jsonOk } from '../_utils'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { supabase, response } = await getSupabaseClientOrResponse()
  if (response) return response

  // Use maybeSingle for all queries to avoid PGRST116 errors on empty tables
  const { data: settings, error: settingsError } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 'default')
    .maybeSingle()

  if (settingsError) {
    return jsonError(`Failed to load site settings: ${settingsError.message}`, 500)
  }

  // menus table from migration 20260313_cms_unification.sql
  const { data: menus, error: menusError } = await supabase
    .from('menus')
    .select('*')
    .eq('is_active', true)
    .eq('status', 'published')
    .order('menu_location', { ascending: true })
    .order('order_index', { ascending: true })

  if (menusError) {
    // If menus table doesn't exist, just return empty menus
    if (
      String(menusError.message || '').toLowerCase().includes('does not exist') ||
      String(menusError.message || '').toLowerCase().includes('relation') ||
      String(menusError.code || '').toLowerCase() === '42p01'
    ) {
      return jsonOk({
        settings: settings || null,
        menus: {},
      })
    }
    return jsonError(`Failed to load menus: ${menusError.message}`, 500)
  }

  // navigation_menus is an optional table, gracefully ignore if missing
  let navMenus = []
  try {
    const { data: navData, error: navError } = await supabase
      .from('navigation_menus')
      .select('*')
      .eq('is_active', true)
      .order('location', { ascending: true })
      .order('order_index', { ascending: true })

    if (!navError && Array.isArray(navData)) {
      navMenus = navData
    }
  } catch {
    // navigation_menus table may not exist - this is acceptable
  }

  const menuSource = Array.isArray(menus) && menus.length
    ? menus.map((item) => ({ ...item, menu_location: item.menu_location || 'header' }))
    : (Array.isArray(navMenus) ? navMenus.map((item) => ({ ...item, menu_location: item.location || 'header' })) : [])

  const groupedMenus = menuSource.reduce((acc, item) => {
    const key = item.menu_location || 'header'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return jsonOk({
    settings: settings || null,
    menus: groupedMenus,
  })
}
