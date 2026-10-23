#!/usr/bin/env node
/**
 * Read-only check of a Main release's intended changes on the live site (used by tools/release/release-main.sh).
 *   ACV_NOINDEX="/a /b" node tools/release/check-intended.mjs [https://www.acadvizen.com]
 * Each address in ACV_NOINDEX must answer 200 with a noindex robots tag in the <head> and be absent from the
 * sitemap. On a sample of pages (and those addresses), for a browser-like visitor and Googlebot, 3 reads each,
 * the <title> and the canonical link must be in the <head>. Exit 1 on any failure. Addresses come through the
 * environment, never as arguments (Git Bash rewrites arguments that start with "/").
 */
const MAIN = (process.argv[2] || 'https://www.acadvizen.com').replace(/\/$/, '')
const noindex = String(process.env.ACV_NOINDEX || '').split(/\s+/).filter(Boolean)
if (!noindex.length || noindex.some((p) => !/^\/[a-z0-9/-]*$/.test(p))) {
  console.log(`FAIL ACV_NOINDEX is missing or not a list of addresses: ${JSON.stringify(process.env.ACV_NOINDEX || '')}`)
  process.exit(1)
}
const sample = ['/', '/about', '/blog', '/testimonials', '/courses', '/tools', '/placement', ...noindex]
const UAS = { browser: 'Mozilla/5.0 acadvizen-release-check', googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
async function get(url, ua) {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': ua || UAS.browser }, signal: AbortSignal.timeout(60000) })
      return { status: r.status, html: await r.text() }
    } catch (e) {
      if (i >= 3) throw e
      await new Promise((ok) => setTimeout(ok, 5000 * i))
    }
  }
}
const bad = []
const sitemap = (await get(`${MAIN}/sitemap.xml`)).html
const listed = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1].trim()).pathname.replace(/\/$/, '') || '/'))
if (listed.size < 100) bad.push(`sitemap lists only ${listed.size} addresses`)
for (const p of noindex) {
  const r = await get(MAIN + p)
  const head = r.html.split('</head>')[0]
  const robots = (head.match(/<meta name="robots" content="([^"]*)"/) || [])[1] || ''
  if (r.status !== 200 || !/noindex/.test(robots)) bad.push(`${p}: status ${r.status}, robots "${robots}"`)
  if (listed.has(p)) bad.push(`${p} is still in the sitemap`)
}
for (const p of sample) {
  for (const [name, ua] of Object.entries(UAS)) {
    for (let i = 0; i < 3; i++) {
      const head = (await get(MAIN + p, ua)).html.split('</head>')[0]
      if (!/<title>/.test(head) || !/rel="canonical"/.test(head)) bad.push(`${p} (${name}, read ${i + 1}): title or canonical not in the <head>`)
    }
  }
}
console.log(bad.length ? `FAIL ${bad.join(' | ')}` : `PASS ${noindex.length} intended noindex addresses (200, noindex, not in the sitemap of ${listed.size}); title and canonical in the <head> on ${sample.length} pages x 2 visitors x 3 reads`)
process.exit(bad.length ? 1 : 0)
