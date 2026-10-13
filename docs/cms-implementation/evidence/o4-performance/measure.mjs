// LOCAL: per route, database requests per page view and the longest chain of sequential requests,
// with 0 / 100 / 200 ms added per database request. Usage: node measure.mjs <label>
import fs from 'node:fs'
const M = 'http://localhost:3100', P = 'http://127.0.0.1:55399/__proxy'
const routes = ['/tools/ahrefs', '/', '/blog', '/blog/google-ads-ai-max-explained-what-the-september-2026-auto-upgrade-changed', '/seo-course-in-bangalore', '/courses', '/ai-digital-marketing-course']
const chain = (log) => { // longest chain of requests where each starts after the previous one ended
  const r = [...log].sort((a, b) => a.start - b.start); const best = r.map(() => 1)
  for (let i = 0; i < r.length; i++) for (let j = 0; j < i; j++) if (r[j].end <= r[i].start) best[i] = Math.max(best[i], best[j] + 1)
  return Math.max(0, ...best) }
const out = []
for (const ms of [0, 100, 200]) {
  await fetch(`${P}/delay?ms=${ms}`)
  for (const route of routes) {
    await fetch(M + route); await fetch(M + route) // warm
    const runs = []
    for (let k = 0; k < 3; k++) {
      await fetch(`${P}/reset`); const t0 = Date.now(); const r = await fetch(M + route); await r.text(); const total = Date.now() - t0
      const log = await (await fetch(`${P}/log`)).json(); runs.push({ status: r.status, total, requests: log.length, chain: chain(log) })
    }
    runs.sort((a, b) => a.total - b.total); const med = runs[1]
    out.push({ ms, route, ...med }); console.log(`delay ${String(ms).padStart(3)}ms ${route.slice(0, 48).padEnd(48)} ${med.status} total ${String(med.total).padStart(5)}ms  db requests ${String(med.requests).padStart(3)}  sequential chain ${med.chain}`)
  }
}
fs.writeFileSync(new URL(`result-${process.argv[2] || 'run'}.json`, import.meta.url), JSON.stringify(out, null, 2))
