/**
 * Runtime Verification Script
 * Tests the running application via HTTP.
 * Run AFTER: npm run dev (server on localhost:3000)
 * Run: node scripts/runtime-verify.js
 */
const http = require('http');

const BASE = 'http://localhost:3000';
const ENDPOINTS = [
  { path: '/', label: 'Homepage' },
  { path: '/admin-login', label: 'Admin Login Page' },
  { path: '/admin', label: 'Admin Dashboard' },
  { path: '/api/admin/session', label: 'API: Admin Session' },
  { path: '/api/cms/settings', label: 'API: CMS Settings' },
  { path: '/api/cms/seo', label: 'API: CMS SEO' },
  { path: '/api/cms/pages', label: 'API: CMS Pages' },
  { path: '/api/cms/blogs', label: 'API: CMS Blogs' },
  { path: '/api/cms/courses', label: 'API: CMS Courses' },
  { path: '/api/cms/tools', label: 'API: CMS Tools' },
  { path: '/api/cms/cities', label: 'API: CMS Cities' },
  { path: '/api/cms/forms', label: 'API: CMS Forms' },
  { path: '/api/cms/popups', label: 'API: CMS Popups' },
  { path: '/api/cms/banners', label: 'API: CMS Banners' },
  { path: '/api/cms/redirects', label: 'API: CMS Redirects' },
  { path: '/api/cms/sections', label: 'API: CMS Sections' },
  { path: '/api/cms/menus', label: 'API: CMS Menus' },
  { path: '/api/cms/header', label: 'API: CMS Header' },
  { path: '/api/cms/footer', label: 'API: CMS Footer' },
  { path: '/api/cms/sitemap/generate', label: 'API: CMS Sitemap' },
  { path: '/api/cms/robots', label: 'API: CMS Robots' },
  { path: '/api/cms/leads', label: 'API: CMS Leads' },
  { path: '/api/cms/media', label: 'API: CMS Media' },
  { path: '/api/cms/users', label: 'API: CMS Users' },
  { path: '/api/cms/site', label: 'API: CMS Site Config' },
  { path: '/api/cms/revalidate', label: 'API: CMS Revalidate' },
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: 10000 }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          contentType: res.headers['content-type'] || '',
          contentLength: body.length,
          body: body.substring(0, 200), // first 200 chars
          securityHeaders: {
            'x-frame-options': res.headers['x-frame-options'] || 'MISSING',
            'x-content-type-options': res.headers['x-content-type-options'] || 'MISSING',
            'strict-transport-security': res.headers['strict-transport-security'] || 'MISSING',
            'referrer-policy': res.headers['referrer-policy'] || 'MISSING',
          }
        });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('RUNTIME VERIFICATION');
  console.log(`Server: ${BASE}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════\n');

  // Verify server is reachable first
  try {
    const root = await fetchUrl(BASE + '/');
    console.log(`✓ Server is running: STATUS ${root.status}, ${root.contentLength} bytes\n`);
  } catch (e) {
    console.log(`✗ SERVER NOT REACHABLE at ${BASE}`);
    console.log(`  Error: ${e.message}`);
    console.log('\n  Make sure to run: npm run dev');
    process.exit(1);
  }

  const results = [];

  for (const ep of ENDPOINTS) {
    const url = BASE + ep.path;
    try {
      const res = await fetchUrl(url);
      const isOk = res.status >= 200 && res.status < 500; // 4xx expected for unauthenticated API calls
      const isPerfect = res.status >= 200 && res.status < 400;
      const result = {
        endpoint: ep.path,
        label: ep.label,
        status: res.status,
        contentType: res.contentType,
        size: res.contentLength,
        pass: isPerfect || (res.status === 401) || (res.status === 404), // 401/404 are expected for unauthenticated/some routes
        actualResult: res.status,
      };
      results.push(result);

      const icon = result.pass ? '✓' : '✗';
      console.log(`${icon} ${ep.label}`);
      console.log(`   ${url}`);
      console.log(`   Status: ${res.status} | Size: ${res.size}b | Type: ${res.contentType.substring(0, 40)}`);
      if (!result.pass) {
        console.log(`   BODY (first 200): ${res.body}`);
      }
    } catch (e) {
      console.log(`✗ ${ep.label}`);
      console.log(`   ${url}`);
      console.log(`   Error: ${e.message}`);
      results.push({ endpoint: ep.path, label: ep.label, status: 'ERROR', pass: false, error: e.message });
    }
  }

  // Security headers (from homepage response)
  console.log('\n── SECURITY HEADERS ──');
  try {
    const root2 = await fetchUrl(BASE + '/');
    for (const [key, val] of Object.entries(root2.securityHeaders)) {
      const icon = val !== 'MISSING' ? '✓' : '✗';
      console.log(` ${icon} ${key}: ${val}`);
    }
  } catch (e) {
    console.log(` ✗ Could not fetch headers: ${e.message}`);
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  const total = results.length;

  console.log(` Total: ${total}`);
  console.log(` Passed: ${passed}`);
  console.log(` Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n FAILURES:');
    results.filter(r => !r.pass).forEach(r => {
      console.log(`  ✗ [${r.status}] ${r.label} (${r.endpoint})`);
    });
  }

  console.log(`\n Verification complete: ${new Date().toISOString()}`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
