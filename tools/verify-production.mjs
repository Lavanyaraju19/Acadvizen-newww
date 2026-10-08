// Read-only smoke test of the live Acadvizen websites (anonymous GET requests only; nothing is
// submitted, no browser, no tracking). Run after a deployment or the CMS cutover:
//   node tools/verify-production.mjs            (before the cutover: CMS checks are reported, not failed)
//   node tools/verify-production.mjs --cutover  (after it: the Master CMS checks must pass too)
// Override the addresses with MAIN_URL, ENROLL_URL and CMS_URL.
const MAIN = (process.env.MAIN_URL || 'https://www.acadvizen.com').replace(/\/$/, '')
const ENROLL = (process.env.ENROLL_URL || 'https://enroll.acadvizen.com').replace(/\/$/, '')
const CMS = (process.env.CMS_URL || 'https://cms.acadvizen.com').replace(/\/$/, '')
const CUTOVER = process.argv.includes('--cutover')
const LOGO_TARGETS = new Set(['https://acadvizen.com/', 'https://www.acadvizen.com/', '/'])

let pass = 0
let fail = 0
let info = 0
function check(name, ok, detail = '', { required = true } = {}) {
  const label = ok ? 'PASS' : required ? 'FAIL' : 'INFO'
  if (ok) pass++
  else if (required) fail++
  else info++
  console.log(`${label.padEnd(4)} ${name}${detail ? ` — ${detail}` : ''}`)
}
async function get(url, { follow = false } = {}) {
  const res = await fetch(url, { redirect: follow ? 'follow' : 'manual', headers: { 'user-agent': 'acadvizen-verify-production' } })
  const text = res.status === 200 ? await res.text() : ''
  return { status: res.status, location: res.headers.get('location') || '', headers: res.headers, text, url: res.url }
}
const tag = (html, re) => ((html.match(re) || [])[1] || '').trim()
const absolute = (base, href) => { try { return new URL(href, base).href } catch { return href } }
function logoHrefs(html, base) {
  const out = new Set()
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]{0,800}?)<\/a>/g)) {
    if (!/<img|<svg/i.test(m[2]) || !/logo/i.test(m[1] + m[2].slice(0, 400))) continue
    const href = (m[1].match(/href="([^"]*)"/) || [])[1]
    if (href) out.add(href.startsWith('/') ? href : absolute(base, href))
  }
  return [...out]
}

console.log(`Main ${MAIN} | Enrollment ${ENROLL} | CMS ${CMS}${CUTOVER ? ' | after cutover' : ''}\n`)

/* Main ------------------------------------------------------------------------------------ */
const apex = await get('https://acadvizen.com/about')
check('Main: acadvizen.com redirects to www', [301, 308].includes(apex.status) && apex.location.startsWith(MAIN), `${apex.status} ${apex.location}`)
const sitemap = await get(`${MAIN}/sitemap.xml`)
const urls = [...new Set((sitemap.text.match(/<loc>[^<]+/g) || []).map((x) => x.slice(5).trim()))]
check('Main: sitemap.xml lists pages', sitemap.status === 200 && urls.length > 100, `${sitemap.status}, ${urls.length} URLs`)
const rows = []
for (let i = 0; i < urls.length; i += 8) {
  rows.push(...(await Promise.all(urls.slice(i, i + 8).map(async (u) => ({ u, ...(await get(u)) })))))
}
const notOk = rows.filter((r) => r.status !== 200)
check('Main: every sitemap URL answers 200 (no redirects, no errors)', notOk.length === 0, notOk.slice(0, 6).map((r) => `${r.u.replace(MAIN, '')} ${r.status}`).join(', '))
const doubled = rows.filter((r) => /\|\s*Acadvizen\s*\|\s*Acadvizen/i.test(tag(r.text, /<title[^>]*>([^<]*)/)))
check('Main: no doubled "| Acadvizen" titles', doubled.length === 0, `${doubled.length} of ${rows.length}`)
const badCanonical = rows.filter((r) => r.status === 200 && !tag(r.text, /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/).startsWith(MAIN))
check('Main: canonical on every page, on the www address', badCanonical.length === 0, badCanonical.slice(0, 5).map((r) => r.u.replace(MAIN, '')).join(', '))
const noindex = rows.filter((r) => /noindex/i.test(tag(r.text, /<meta[^>]+name="robots"[^>]+content="([^"]+)"/)))
check('Main: no sitemap page is noindex', noindex.length === 0, noindex.map((r) => r.u.replace(MAIN, '')).join(', '))
const staging = rows.filter((r) => /acadvizen-cms-staging|staging-cms\.acadvizen|cms\.acadvizen\.com\/(?!wp-content)/.test(r.text))
check('Main: no staging addresses in any page', staging.length === 0, staging.slice(0, 5).map((r) => r.u.replace(MAIN, '')).join(', '))
const testData = rows.filter((r) => /local-e2e|Local E2E/i.test(r.text))
check('Main: no "Local E2E" test content on any page', testData.length === 0, `${testData.length} pages${testData.length ? `: ${testData.slice(0, 4).map((r) => r.u.replace(MAIN, '')).join(', ')}` : ''}`)
for (const p of ['/courses/local-e2e-course-1779297401', '/tools/local-e2e-tool-1779297401']) {
  const r = await get(MAIN + p)
  check(`Main: test record ${p} gone`, r.status === 404 || r.status === 410, String(r.status))
}
for (const p of ['/', '/about', '/contact', '/blog', '/tools', '/courses', '/login', '/admin', '/robots.txt']) {
  const r = await get(MAIN + p)
  check(`Main: ${p} answers`, r.status === 200 || (p === '/admin' && [200, 307, 308].includes(r.status)), String(r.status))
}
const home = await get(`${MAIN}/`)
const mainLogos = logoHrefs(home.text, MAIN)
check('Main: logo links to the Main homepage', !mainLogos.length || mainLogos.every((h) => LOGO_TARGETS.has(h)), mainLogos.join(', ') || 'logo drawn in the browser (check visually)', { required: false })
const contact = await get(`${MAIN}/contact`)
check('Main: /contact form present', /<form/i.test(contact.text) || /fullName|full_name|acv-lead-form/.test(contact.text), contact.status === 200 ? 'form markup found' : String(contact.status), { required: false })
const bridged = rows.filter((r) => r.headers.get('x-acadvizen-render-version'))
check('Main: pages served from the WordPress CMS (after cutover)', bridged.length > rows.length * 0.9, `${bridged.length} of ${rows.length}`, { required: CUTOVER })

/* Enrollment ------------------------------------------------------------------------------ */
for (const p of ['/sitemap_index.xml', '/page-sitemap.xml', '/post-sitemap.xml']) {
  const r = await get(ENROLL + p)
  check(`Enrollment: ${p} is XML`, r.status === 200 && /<(sitemapindex|urlset)/.test(r.text), String(r.status))
}
const index = await get(`${ENROLL}/sitemap_index.xml`)
const internal = (index.text.match(/<loc>[^<]*(elementor-hf|metform-form|popupkit|wpr_mega_menu|elementor_library)[^<]*/g) || [])
check('Enrollment: sitemap has no page-builder internals', index.status === 200 && internal.length === 0, internal.map((x) => x.slice(5)).join(', '))
const pageMap = await get(`${ENROLL}/page-sitemap.xml`)
const postMap = await get(`${ENROLL}/post-sitemap.xml`)
const leak = [`${ENROLL}/test/`, `${ENROLL}/3570-2/`].filter((u) => (pageMap.text + postMap.text).includes(u))
check('Enrollment: test page and untitled post not in the sitemap', leak.length === 0, leak.join(', '))
const robots = await get(`${ENROLL}/robots.txt`)
check('Enrollment: robots.txt names the sitemap index', robots.text.includes(`${ENROLL}/sitemap_index.xml`))
for (const [from, to] of [
  ['/contact-us/', '/digital-marketing-course-enquiry/'],
  ['/about-us/', '/about-us-digital-marketing-institute-jayanagar/'],
  ['/advanced-digital-marketing-course-in-mangalore/', '/ai-integrated-digital-marketing-course-in-mangalore/'],
  ['/social-media-influencer-marketing/', '/learn-digital-marketing/'],
]) {
  const r = await get(ENROLL + from)
  const target = r.location.replace(ENROLL, '')
  const end = r.location ? await get(absolute(ENROLL + from, r.location)) : { status: 0 }
  check(`Enrollment: ${from} → ${to} (301, one hop)`, r.status === 301 && target === to && end.status === 200, `${r.status} ${target} → ${end.status}`)
}
const ehome = await get(`${ENROLL}/`)
check('Enrollment: homepage links no 404 address (/contact-us/)', !/href="[^"]*\/contact-us\//.test(ehome.text))
const enrollLogos = logoHrefs(ehome.text, ENROLL)
check('Enrollment: logo links to https://acadvizen.com/', enrollLogos.length > 0 && enrollLogos.every((h) => LOGO_TARGETS.has(h) && h !== '/'), enrollLogos.join(', '))
const routes = await get(`${ENROLL}/wp-json/acadvizen/v1`)
check('Enrollment: enquiry API POST /acadvizen/v1/enquiry registered', /"\/acadvizen\/v1\/enquiry"[\s\S]{0,200}POST/.test(routes.text) || /acadvizen\\\/v1\\\/enquiry/.test(routes.text), String(routes.status))

/* Master CMS ------------------------------------------------------------------------------ */
const login = await get(`${CMS}/wp-login.php`)
const loginLogo = tag(login.text, /wp-login-logo"><a href="([^"]+)"/)
check('CMS: login page answers', login.status === 200, String(login.status))
check('CMS: login logo links to the Main website', LOGO_TARGETS.has(loginLogo), loginLogo, { required: CUTOVER })
check('CMS: not the staging copy', !/STAGING|staging-cms/i.test(login.text), '', { required: CUTOVER })
check('CMS: kept out of search engines (X-Robots-Tag noindex)', /noindex/i.test(login.headers.get('x-robots-tag') || '') || /noindex/i.test(login.text), login.headers.get('x-robots-tag') || 'meta')
const ns = await get(`${ENROLL}/wp-json/`)
check('Enrollment: Acadvizen Master Admin plugin active (acadvizen-cms/v1)', /acadvizen-cms\/v1/.test(ns.text), '', { required: CUTOVER })

console.log(`\n${pass} passed, ${fail} failed, ${info} for information`)
process.exitCode = fail ? 1 : 0
