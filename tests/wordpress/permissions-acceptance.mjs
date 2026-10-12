// Backend permission checks by direct request (LOCAL; uses the local Author and Contributor accounts).
// Every "Main Website" tab is collected as the Administrator, then requested directly by an Author and
// by a Contributor: only Blogs may open for them (WordPress's own post rules); every other screen, the
// plugin Settings, the Main media upload and WordPress's plugin installer must be refused.
//   WP_ADMIN_USER/PASS, WP_AUTHOR_USER/PASS, WP_CONTRIBUTOR_USER/PASS  node tests/wordpress/permissions-acceptance.mjs
import { WP, screen, launch, login } from './acceptanceKit.mjs'

let pass = 0
let fail = 0
const check = (name, ok, detail = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`) }

const { browser } = await launch()
const admin = await login(browser, process.env.WP_ADMIN_USER, process.env.WP_ADMIN_PASS)
await admin.goto(screen('pages'))
const entities = [...new Set((await admin.locator('.nav-tab').evaluateAll((tabs) => tabs.map((a) => new URL(a.href).searchParams.get('entity')))).filter(Boolean))]
check('the Administrator sees every Main Website tab', entities.length >= 20, `${entities.length} tabs`)

for (const [role, user, pass_] of [['Author', process.env.WP_AUTHOR_USER, process.env.WP_AUTHOR_PASS], ['Contributor', process.env.WP_CONTRIBUTOR_USER, process.env.WP_CONTRIBUTOR_PASS]]) {
  const page = await login(browser, user, pass_)
  const opened = []
  const refused = []
  for (const entity of entities) {
    const r = await page.goto(screen(entity))
    ;(r.status() === 200 && !/not allowed/i.test(await page.locator('body').innerText().catch(() => '')) ? opened : refused).push(entity)
  }
  check(`${role}: only Blogs opens; every other Main Website screen is refused`, opened.length === 1 && opened[0] === 'blogs', `opened [${opened.join(', ')}] | refused ${refused.length}`)
  const settings = await page.goto(`${WP}/wp-admin/admin.php?page=acadvizen-cms-settings`)
  check(`${role}: the plugin Settings (connection, secrets status) are refused`, settings.status() === 403 || /not allowed/i.test(await page.locator('body').innerText()), `HTTP ${settings.status()}`)
  const upload = await page.request.post(`${WP}/wp-admin/admin-post.php?action=acv_cms_main_upload`, { multipart: { file: { name: 'x.png', mimeType: 'image/png', buffer: Buffer.from('89504e470d0a1a0a', 'hex') } } })
  check(`${role}: a direct upload to the Main media library is refused`, upload.status() === 403 || upload.status() === 400, `HTTP ${upload.status()}`)
  const plugins = await page.goto(`${WP}/wp-admin/plugin-install.php?tab=upload`)
  check(`${role}: WordPress's plugin installer is refused`, plugins.status() === 403 || /not allowed/i.test(await page.locator('body').innerText()), `HTTP ${plugins.status()}`)
  await page.context().close()
}
await browser.close()
console.log(`\n${pass} passed, ${fail} failed (${WP})`)
process.exit(fail ? 1 : 0)
