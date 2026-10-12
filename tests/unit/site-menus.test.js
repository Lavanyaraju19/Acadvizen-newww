import test from 'node:test'
import assert from 'node:assert/strict'

import { fetchSiteSettingsAndMenus } from '../../lib/siteMenus.js'
import { groupMenuRows } from '../../lib/menuTree.js'

// The previous, sequential implementation (lib/siteCmsServer.js before the change), kept as the
// reference: the concurrent version must return exactly what it returned in every case.
async function sequentialReference(supabase) {
  try {
    const { data: settings, error: settingsError } = await supabase.from('site_settings').select('*').eq('id', 'default').maybeSingle()
    if (settingsError) return { settings: null, menus: groupMenuRows([]) }
    const { data: menus, error: menusError } = await supabase
      .from('menus').select('*').eq('is_active', true).eq('status', 'published')
      .order('menu_location', { ascending: true }).order('order_index', { ascending: true })
    if (menusError) return { settings: settings || null, menus: groupMenuRows([]) }
    let navMenus = []
    try {
      const { data: navData, error: navError } = await supabase
        .from('navigation_menus').select('*').eq('is_active', true)
        .order('location', { ascending: true }).order('order_index', { ascending: true })
      if (!navError && Array.isArray(navData)) navMenus = navData
    } catch {
      // optional
    }
    const menuSource = Array.isArray(menus) && menus.length
      ? menus.map((item) => ({ ...item, menu_location: item.menu_location || 'header' }))
      : (Array.isArray(navMenus) ? navMenus.map((item) => ({ ...item, menu_location: item.location || 'header' })) : [])
    return { settings: settings || null, menus: groupMenuRows(menuSource) }
  } catch {
    return { settings: null, menus: groupMenuRows([]) }
  }
}

// Minimal stand-in for the Supabase query builder: chainable, thenable after `delay` ms.
function fakeSupabase(tables, { delay = 0, events = [] } = {}) {
  return {
    from(table) {
      const spec = tables[table] ?? { data: [], error: null }
      const builder = {
        select: () => builder, eq: () => builder, order: () => builder, maybeSingle: () => builder,
        then(resolve, reject) {
          events.push(['start', table, Date.now()])
          setTimeout(() => {
            events.push(['end', table, Date.now()])
            if (spec === 'throw') reject(new Error(`${table} failed`))
            else resolve(spec)
          }, delay)
        },
      }
      return builder
    },
  }
}

const SETTINGS = { data: { id: 'default', site_name: 'Acadvizen' }, error: null }
const MENUS = { data: [{ id: 'm1', title: 'Courses', menu_location: 'header', order_index: 0, parent_id: null }, { id: 'm2', title: 'Privacy', menu_location: 'footer', order_index: 0, parent_id: null }, { id: 'm3', title: 'Blog', menu_location: null, order_index: 1, parent_id: null }], error: null }
const NAV = { data: [{ id: 'n1', label: 'Home', location: 'header', order_index: 0, parent_id: null }, { id: 'n2', label: 'Terms', location: null, order_index: 1, parent_id: null }], error: null }
const ERR = { data: null, error: { message: 'boom' } }

const cases = {
  'menus present': { site_settings: SETTINGS, menus: MENUS, navigation_menus: NAV },
  'menus empty, navigation fallback': { site_settings: SETTINGS, menus: { data: [], error: null }, navigation_menus: NAV },
  'menus null, navigation fallback': { site_settings: SETTINGS, menus: { data: null, error: null }, navigation_menus: NAV },
  'settings missing (null row)': { site_settings: { data: null, error: null }, menus: MENUS, navigation_menus: NAV },
  'settings error': { site_settings: ERR, menus: MENUS, navigation_menus: NAV },
  'settings query throws': { site_settings: 'throw', menus: MENUS, navigation_menus: NAV },
  'menus error': { site_settings: SETTINGS, menus: ERR, navigation_menus: NAV },
  'menus query throws': { site_settings: SETTINGS, menus: 'throw', navigation_menus: NAV },
  'navigation error, menus empty': { site_settings: SETTINGS, menus: { data: [], error: null }, navigation_menus: ERR },
  'navigation throws, menus present': { site_settings: SETTINGS, menus: MENUS, navigation_menus: 'throw' },
  'navigation throws, menus empty': { site_settings: SETTINGS, menus: { data: [], error: null }, navigation_menus: 'throw' },
  'navigation not an array': { site_settings: SETTINGS, menus: { data: [], error: null }, navigation_menus: { data: { id: 'x' }, error: null } },
}

for (const [name, tables] of Object.entries(cases)) {
  test(`same result as the sequential version: ${name}`, async () => {
    assert.deepEqual(await fetchSiteSettingsAndMenus(fakeSupabase(tables)), await sequentialReference(fakeSupabase(tables)))
  })
}

test('menus from the menus table are grouped by location, missing location = header', async () => {
  const { settings, menus } = await fetchSiteSettingsAndMenus(fakeSupabase(cases['menus present']))
  assert.equal(settings.site_name, 'Acadvizen')
  assert.deepEqual(menus, groupMenuRows(MENUS.data.map((m) => ({ ...m, menu_location: m.menu_location || 'header' }))))
})

test('a client whose from() throws degrades to the safe default', async () => {
  const result = await fetchSiteSettingsAndMenus({ from() { throw new Error('no client') } })
  assert.deepEqual(result, { settings: null, menus: groupMenuRows([]) })
})

test('the three reads run concurrently: one round trip instead of three', async () => {
  const events = []
  const t0 = Date.now()
  await fetchSiteSettingsAndMenus(fakeSupabase(cases['menus present'], { delay: 60, events }))
  const elapsed = Date.now() - t0
  const starts = events.filter((e) => e[0] === 'start')
  const firstEnd = Math.min(...events.filter((e) => e[0] === 'end').map((e) => e[2]))
  assert.equal(starts.length, 3)
  assert.ok(starts.every((e) => e[2] <= firstEnd), 'every query starts before the first one finishes')
  assert.ok(elapsed < 150, `took ${elapsed} ms; three sequential round trips would take at least 180 ms`)
})
