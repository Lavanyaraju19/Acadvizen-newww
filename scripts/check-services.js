/* Check which local services are reachable. */
const http = require('node:http');

function probe(url, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const req = http.get(url, (res) => {
      res.resume();
      resolve({ ok: true, status: res.statusCode, ms: Date.now() - startedAt });
    });
    req.on('error', (e) => resolve({ ok: false, error: e.message }));
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('timeout'));
    });
  });
}

async function main() {
  const targets = [
    'http://127.0.0.1:3200/api/health',
    'http://127.0.0.1:3000/api/health',
    'http://127.0.0.1:55321/rest/v1/',
    'http://127.0.0.1:54321/rest/v1/',
  ];
  for (const t of targets) {
    const r = await probe(t);
    console.log(r.ok ? `OK   ${t} -> ${r.status} (${r.ms}ms)` : `DOWN ${t} -> ${r.error}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

