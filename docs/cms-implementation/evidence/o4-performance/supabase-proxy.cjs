// LOCAL measurement proxy: forwards to the local Supabase (127.0.0.1:55321), optionally adding a fixed delay
// per request (to model the Vercel function -> Sydney database round trip), and logs each request's timing.
// Control: GET /__proxy/delay?ms=N  |  GET /__proxy/reset  |  GET /__proxy/log
const http = require('http')
let delay = 0, log = []
http.createServer((req, res) => {
  if (req.url.startsWith('/__proxy/')) {
    const u = new URL(req.url, 'http://x')
    if (u.pathname === '/__proxy/delay') delay = Number(u.searchParams.get('ms') || 0)
    if (u.pathname === '/__proxy/reset') log = []
    res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify(u.pathname === '/__proxy/log' ? log : { delay }))
  }
  const start = Date.now(); const body = []
  req.on('data', (c) => body.push(c)); req.on('end', () => setTimeout(() => {
    const up = http.request({ host: '127.0.0.1', port: 55321, path: req.url, method: req.method, headers: { ...req.headers, host: '127.0.0.1:55321' } }, (r) => {
      res.writeHead(r.statusCode, r.headers); r.pipe(res)
      r.on('end', () => log.push({ start, end: Date.now(), method: req.method, path: req.url.split('?')[0], status: r.statusCode }))
    })
    up.on('error', () => { res.statusCode = 502; res.end() }); up.end(Buffer.concat(body))
  }, delay))
}).listen(55399, () => console.log('proxy on 55399'))
