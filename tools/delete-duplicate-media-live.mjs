// PRODUCTION: permanently deletes duplicate media files that a fresh reference scan marked SAFE TO DELETE (an
// identical copy stays; no reference in any design, meta, content, page HTML or stylesheet). Recovery: every file is
// in the restore-tested 24 Oct backup (file and database record, checked), and before each deletion a fresh copy of
// the file and its full media record is saved to BACKUP_DIR (SHA-256 listed). The plugin's media-in-use guard stays
// on: a file still in use is refused by WordPress and reported, not forced.
//
//   WP_STORAGE_STATE=<session.json> SCAN=<media-scan.json> BACKUP_DIR=<dir> [APPLY=1] node tools/delete-duplicate-media-live.mjs
// Prints no cookie or nonce.
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
const WP = 'https://enroll.acadvizen.com'
const APPLY = process.env.APPLY === '1'
const dir = process.env.BACKUP_DIR; fs.mkdirSync(dir, { recursive: true })
const safe = JSON.parse(fs.readFileSync(process.env.SCAN, 'utf8')).filter((x) => x.decision === 'SAFE TO DELETE')
const t = () => new Date().toISOString().slice(11, 19) + 'Z'
const b = await chromium.launch(); const ctx = await b.newContext({ storageState: process.env.WP_STORAGE_STATE }); const p = await ctx.newPage()
await p.goto(`${WP}/wp-admin/admin-ajax.php?action=rest-nonce`); const nonce = (await p.locator('body').innerText()).trim()
if (!/^[a-f0-9]{10}$/.test(nonce)) { console.log('STOP: not signed in'); process.exit(2) }
const sums = []; let deleted = 0, refused = 0, skipped = 0
for (const x of safe) {
  // A dropped connection skips that file (reported, one line, no request details); the run goes on.
  try {
  const rec = await ctx.request.get(`${WP}/wp-json/wp/v2/media/${x.id}?context=edit`, { headers: { 'X-WP-Nonce': nonce } })
  if (rec.status() !== 200) { console.log(`${t()} SKIP #${x.id}: not found (${rec.status()})`); skipped++; continue }
  const m = await rec.json()
  if (!m.source_url.endsWith(x.file)) { console.log(`${t()} SKIP #${x.id}: file changed (${m.source_url})`); skipped++; continue }
  const f = await ctx.request.get(m.source_url); const buf = await f.body()
  if (f.status() !== 200 || buf.length !== x.size) { console.log(`${t()} SKIP #${x.id}: file not as scanned (HTTP ${f.status()}, ${buf.length} B)`); skipped++; continue }
  const name = `${x.id}-${path.basename(x.file)}`; fs.writeFileSync(path.join(dir, name), buf); fs.writeFileSync(path.join(dir, `${x.id}.json`), JSON.stringify(m))
  sums.push(`${createHash('sha256').update(buf).digest('hex')}  ${name}`)
  if (!APPLY) { console.log(`${t()} PLAN #${x.id} ${x.file} (${x.size} B) saved; would delete`); continue }
  const d = await ctx.request.delete(`${WP}/wp-json/wp/v2/media/${x.id}?force=true`, { headers: { 'X-WP-Nonce': nonce } })
  const gone = (await fetch(`${m.source_url}?d=${Date.now()}`)).status
  if (d.status() === 200 && gone === 404) { deleted++; console.log(`${t()} DELETED #${x.id} ${x.file} (file now ${gone})`) } else { refused++; console.log(`${t()} NOT DELETED #${x.id} ${x.file}: HTTP ${d.status()} ${(await d.text()).slice(0, 120)}; file ${gone}`) }
  } catch (e) { skipped++; console.log(`${t()} SKIP #${x.id}: ${String(e.message).split('\n')[0].slice(0, 100)}`) }
}
fs.writeFileSync(path.join(dir, 'SHA256SUMS.txt'), sums.join('\n') + '\n')
console.log(`${t()} ${APPLY ? 'deleted' : 'planned'} ${APPLY ? deleted : sums.length}, refused ${refused}, skipped ${skipped} of ${safe.length}`)
await b.close()
