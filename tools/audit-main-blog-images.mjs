// READ-ONLY audit of every blog post in the Main Website's sitemap: each post's image addresses (featured image,
// in-content images, srcset/lazy-load variants, social/structured-data images, header/footer/sidebar images), where in
// the page each one appears, and whether it loads (HTTP status after redirects). Also the post's visible-text hash,
// so content changes show up. Anonymous GET requests only.
//
//   node tools/audit-main-blog-images.mjs <out-prefix>      -> <out-prefix>.json, <out-prefix>.csv
// MAIN_URL overrides the website (default https://www.acadvizen.com).
import fs from 'node:fs'
import { createHash } from 'node:crypto'
const MAIN = (process.env.MAIN_URL || 'https://www.acadvizen.com').replace(/\/$/, '')
const [out] = process.argv.slice(2)
if (!out) { console.log('usage: node tools/audit-main-blog-images.mjs <out-prefix>'); process.exit(2) }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function get(url, method = 'GET') {
  for (let i = 0; i < 4; i++) {
    try { const r = await fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(120000), headers: { 'User-Agent': 'Mozilla/5.0 acadvizen-image-audit' } }); return { status: r.status, url: r.url, html: method === 'GET' ? await r.text() : '' } } catch (e) { if (i === 3) return { status: 0, url, html: '', err: String(e.message).split('\n')[0] }; await sleep(5000 * (i + 1)) }
  }
}
const locs = async (u) => [...(await get(u)).html.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
async function pool(items, n, fn) { const res = []; let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; res[k] = await fn(items[k]) } })); return res }
// Image addresses: any absolute or site-relative URL ending in an image extension (src, srcset, data-*, CSS, JSON-LD).
const IMG = /(?:https?:)?\/\/[^"'\s,()<>]+?\.(?:jpe?g|png|webp|gif|svg|avif)(?:\?[^"'\s,()<>]*)?|(?<=["'(\s,])\/wp-content\/uploads\/[^"'\s,()<>]+?\.(?:jpe?g|png|webp|gif|svg|avif)/gi
const norm = (u) => (u.startsWith('//') ? 'https:' + u : u.startsWith('/') ? 'https://enroll.acadvizen.com' + u : u).replace(/&amp;/g, '&')
const textHash = (h) => createHash('sha1').update(h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim()).digest('hex').slice(0, 12)
function sections(h) {
  const head = h.split(/<\/head>/i)[0]
  const body = h.slice(head.length)
  const cut = (re) => { const m = body.match(re); return m ? m[0] : '' }
  const header = cut(/<header[\s\S]*?<\/header>|data-elementor-type="header"[\s\S]*?(?=data-elementor-type="(?:wp-post|single-post|wp-page)")/i)
  const footer = cut(/<footer[\s\S]*$/i)
  const content = cut(/<article[\s\S]*?<\/article>|data-elementor-type="(?:wp-post|single-post)"[\s\S]*?(?=<footer|data-elementor-type="footer")/i) || cut(/<main[\s\S]*?<\/main>/i)
  return { head, header, content, footer, rest: body }
}
const sm = await locs(`${MAIN}/sitemap.xml`); let all = sm
if (sm.some((u) => u.endsWith('.xml'))) { all = []; for (const s of sm) all.push(...await locs(s)) }
const posts = all.filter((u) => /\/blog\/[^/]+\/?$/.test(new URL(u).pathname))
console.log(`${new Date().toISOString()} Main sitemap: ${all.length} addresses, ${posts.length} blog posts`)
const rows = await pool(posts, 6, async (u) => {
  const r = await get(u); const s = sections(r.html)
  const find = (part) => [...new Set([...part.matchAll(IMG)].map((m) => norm(m[0])))]
  const where = {}; const add = (k, list) => list.forEach((x) => { (where[x] = where[x] || new Set()).add(k) })
  add('head', find(s.head)); add('header', find(s.header)); add('content', find(s.content)); add('footer', find(s.footer))
  for (const x of find(s.rest)) if (!where[x]) (where[x] = new Set()).add('other')
  const imgTags = (s.content.match(/<img\b/gi) || []).length
  return { post: new URL(u).pathname, status: r.status, final: r.url, textHash: textHash(r.html), imgTagsInContent: imgTags, images: Object.fromEntries(Object.entries(where).map(([k, v]) => [k, [...v]])) }
})
const unique = [...new Set(rows.flatMap((r) => Object.keys(r.images)))]
const checks = Object.fromEntries((await pool(unique, 8, async (u) => { const r = await get(u, 'HEAD'); return [u, { status: r.status, final: r.url === u ? '' : r.url }] })))
const byPart = {}; for (const r of rows) for (const [u, parts] of Object.entries(r.images)) for (const p of parts) (byPart[p] = byPart[p] || new Set()).add(u)
const ext = unique.reduce((a, u) => { const e = (u.match(/\.(jpe?g|png|webp|gif|svg|avif)/i) || [])[1].toLowerCase(); a[e] = (a[e] || 0) + 1; return a }, {})
const hosts = unique.reduce((a, u) => { const h = new URL(u).host; a[h] = (a[h] || 0) + 1; return a }, {})
const enrollUploads = unique.filter((u) => /^https:\/\/enroll\.acadvizen\.com\/wp-content\/uploads\//.test(u))
const failed = unique.filter((u) => checks[u].status !== 200)
const summary = { read_at: new Date().toISOString(), posts: rows.length, posts_not_200: rows.filter((r) => r.status !== 200).map((r) => `${r.status} ${r.post}`), unique_images: unique.length, enroll_upload_images: enrollUploads.length, failed: failed.map((u) => `${checks[u].status} ${u}`), by_part: Object.fromEntries(Object.entries(byPart).map(([k, v]) => [k, v.size])), by_extension: ext, by_host: hosts, content_img_tags_total: rows.reduce((a, r) => a + r.imgTagsInContent, 0) }
fs.writeFileSync(`${out}.json`, JSON.stringify({ summary, checks, rows }, null, 1))
fs.writeFileSync(`${out}.csv`, ['post,status,text_hash,img_tags_in_content,images_total,images_in_content,images_in_head,images_in_header,images_in_footer,images_other,failed_images', ...rows.map((r) => { const e = Object.entries(r.images); const n = (p) => e.filter(([, v]) => v.includes(p)).length; return [r.post, r.status, r.textHash, r.imgTagsInContent, e.length, n('content'), n('head'), n('header'), n('footer'), n('other'), e.filter(([u]) => checks[u].status !== 200).map(([u]) => u).join(' ')].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',') })].join('\n'))
console.log(JSON.stringify(summary, null, 1))
