// Live smoke test of the Master Admin plugin's API (wordpress/acadvizen-cms, namespace acadvizen-cms/v1).
// GET requests only; nothing is created or changed. Requests are signed with the Main Website's own
// signer (lib/wordpress/signature.js), so a pass also proves both sides agree.
//   node tools/cms-api-smoke.mjs                       (production Enrollment; refusal checks only)
//   CMS_API_URL=http://localhost:8088/wp-json/acadvizen-cms/v1 node tools/cms-api-smoke.mjs   (a test WordPress)
// With WORDPRESS_CMS_WEBHOOK_SECRET in the environment (the value from wp-config/Vercel; it is never
// printed) the correctly signed requests are checked too.
import { randomBytes } from 'node:crypto'
import { signPayload } from '../lib/wordpress/signature.js'

const API = (process.env.CMS_API_URL || 'https://enroll.acadvizen.com/wp-json/acadvizen-cms/v1').replace(/\/$/, '')
const SITE_INDEX = API.replace(/\/acadvizen-cms\/v1$/, '/')
const SECRET = process.env.WORDPRESS_CMS_WEBHOOK_SECRET || ''
const OTHER_SECRET = randomBytes(32).toString('hex')

let pass = 0
let fail = 0
function check(name, ok, detail = '') {
  if (ok) pass++
  else fail++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
}
function signed(message, secret, timestamp = Math.floor(Date.now() / 1000)) {
  return { 'X-Acadvizen-Timestamp': String(timestamp), 'X-Acadvizen-Signature': signPayload(message, timestamp, secret) }
}
async function get(url, headers = {}) {
  const res = await fetch(url, { headers: { 'user-agent': 'acadvizen-cms-api-smoke', ...headers }, redirect: 'manual' })
  let json = null
  try { json = await res.json() } catch { /* not JSON */ }
  return { status: res.status, json, cacheControl: res.headers.get('cache-control') || '' }
}

console.log(`API ${API}${SECRET ? ' | shared secret supplied (not shown)' : ' | no shared secret: refusal checks only'}\n`)

const site = await get(SITE_INDEX)
const routes = site.json?.routes || {}
check('site REST index answers', site.status === 200, `HTTP ${site.status}`)
check('acadvizen-cms/v1 namespace registered', (site.json?.namespaces || []).includes('acadvizen-cms/v1'))
for (const route of ['/acadvizen-cms/v1/blogs', '/acadvizen-cms/v1/manifest', '/acadvizen-cms/v1/render']) {
  check(`route ${route} registered (GET)`, (routes[route]?.methods || []).includes('GET'))
}
check('existing enquiry route still registered (POST)', (routes['/acadvizen/v1/enquiry']?.methods || []).includes('POST'))

const blogs = await get(`${API}/blogs`)
check('GET /blogs answers with a list', blogs.status === 200 && Array.isArray(blogs.json?.items), `HTTP ${blogs.status}`)
check('GET /blogs is not cached by the server', /no-store/.test(blogs.cacheControl), blogs.cacheControl || 'no Cache-Control')
check('GET /blogs lists only published Main/Both blogs', blogs.status === 200 && (blogs.json?.items || []).every((b) => ['main', 'both'].includes(b.publish_to)))

const refusals = [
  ['unsigned /manifest', `${API}/manifest`, {}],
  ['malformed signature', `${API}/manifest`, { 'X-Acadvizen-Timestamp': String(Math.floor(Date.now() / 1000)), 'X-Acadvizen-Signature': 'v1=zz' }],
  ['signature with another secret', `${API}/manifest`, signed('manifest.', OTHER_SECRET)],
  ['unsigned /render', `${API}/render?path=%2F`, {}],
]
if (SECRET) {
  refusals.push(['expired (10 min old) correct signature', `${API}/manifest`, signed('manifest.', SECRET, Math.floor(Date.now() / 1000) - 600)])
  refusals.push(['render signed for another path', `${API}/render?path=%2Fabout-x`, signed('render./courses', SECRET)])
}
for (const [name, url, headers] of refusals) {
  const res = await get(url, headers)
  check(`refused: ${name}`, res.status === 401, `HTTP ${res.status}`)
}

if (SECRET) {
  const manifest = await get(`${API}/manifest`, signed('manifest.', SECRET))
  check('signed /manifest accepted', manifest.status === 200 && Array.isArray(manifest.json?.pages) && Array.isArray(manifest.json?.redirects), `HTTP ${manifest.status}`)
  check('signed /manifest is not cached by the server', /no-store/.test(manifest.cacheControl))
  const missing = '/acadvizen-smoke-test-no-such-page'
  const render = await get(`${API}/render?path=${encodeURIComponent(missing)}`, signed(`render.${missing}`, SECRET))
  check('signed /render of a page that is not published -> 404', render.status === 404, `HTTP ${render.status}`)
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
