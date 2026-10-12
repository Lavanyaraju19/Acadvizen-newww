// Site settings and public menus for PublicLayout (used by lib/siteCmsServer.js).
//
// The three reads are independent, so they run concurrently. They used to run one after another,
// which put two extra database round trips on every public page; on Vercel the database is far
// from the functions, so each round trip is expensive. The result is exactly what the sequential
// version returned, including every failure case. Kept free of server-only imports so it can be
// unit-tested (tests/unit/site-menus.test.js).
import { groupMenuRows } from './menuTree.js'

// A query that throws is reported like a failed query, marked so the original fallbacks still apply.
const settle = (query) => Promise.resolve(query).then((result) => result || {}, (error) => ({ data: null, error, threw: true }))

export async function fetchSiteSettingsAndMenus(supabase) {
  try {
    const [settingsResult, menusResult, navResult] = await Promise.all([
      settle(supabase.from('site_settings').select('*').eq('id', 'default').maybeSingle()),
      settle(
        supabase
          .from('menus')
          .select('*')
          .eq('is_active', true)
          .eq('status', 'published')
          .order('menu_location', { ascending: true })
          .order('order_index', { ascending: true })
      ),
      // navigation_menus is optional: any failure there just means "no fallback menu".
      settle(
        supabase
          .from('navigation_menus')
          .select('*')
          .eq('is_active', true)
          .order('location', { ascending: true })
          .order('order_index', { ascending: true })
      ),
    ])

    if (settingsResult.threw || menusResult.threw) return { settings: null, menus: groupMenuRows([]) }
    if (settingsResult.error) return { settings: null, menus: groupMenuRows([]) }

    const settings = settingsResult.data || null
    if (menusResult.error) return { settings, menus: groupMenuRows([]) }

    const menus = menusResult.data
    const navMenus = !navResult.error && Array.isArray(navResult.data) ? navResult.data : []
    const menuSource = Array.isArray(menus) && menus.length
      ? menus.map((item) => ({ ...item, menu_location: item.menu_location || 'header' }))
      : navMenus.map((item) => ({ ...item, menu_location: item.location || 'header' }))

    return { settings, menus: groupMenuRows(menuSource) }
  } catch {
    return { settings: null, menus: groupMenuRows([]) }
  }
}
