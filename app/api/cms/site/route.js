import { getSupabaseClientOrResponse, jsonError, jsonOk } from '../_utils'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { supabase, response } = getSupabaseClientOrResponse()
  if (response) return response

  const [{ data: settings, error: settingsError }, { data: menus, error: menusError }, { data: navMenus, error: navMenusError }] = await Promise.all([
    supabase.from('site_settings').select('*').eq('id', 'default').maybeSingle(),
    supabase
      .from('menus')
      .select('*')
      .eq('is_active', true)
      .order('menu_location', { ascending: true })
      .order('order_index', { ascending: true }),
    supabase
      .from('navigation_menus')
      .select('*')
      .eq('is_active', true)
      .order('location', { ascending: true })
      .order('order_index', { ascending: true }),
  ])

  if (settingsError) return jsonError(`Failed to load site settings: ${settingsError.message}`, 200)
  if (menusError) return jsonError(`Failed to load menus: ${menusError.message}`, 200)
  if (navMenusError && !String(navMenusError.message || '').toLowerCase().includes('does not exist')) {
    return jsonError(`Failed to load navigation menus: ${navMenusError.message}`, 200)
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
