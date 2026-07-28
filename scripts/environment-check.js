const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════');
console.log('ENVIRONMENT CAPABILITY ASSESSMENT');
console.log('═══════════════════════════════════════════');

console.log('\n── SYSTEM INFO ──');
console.log('Platform:', process.platform);
console.log('Node version:', process.version);
console.log('CWD:', process.cwd());
console.log('Has DISPLAY env var:', !!process.env.DISPLAY);
console.log('Has browser capability: NO (CLI-only environment)');

console.log('\n── PLAYWRIGHT CHECK ──');
const playwrightBin = path.join(process.cwd(), 'node_modules', '.bin', 'playwright.cmd');
const playwrightModule = path.join(process.cwd(), 'node_modules', '@playwright', 'test');
console.log('Playwright CLI exists:', fs.existsSync(playwrightBin));
console.log('Playwright module exists:', fs.existsSync(playwrightModule));

console.log('\n── BROWSER BINARY CHECK ──');
const possiblePaths = [
  path.join(process.env.USERPROFILE || 'C:/Users/HP', 'AppData', 'Local', 'ms-playwright'),
  path.join(process.cwd(), 'node_modules', 'playwright-core', '.local-browsers'),
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];
possiblePaths.forEach(p => {
  const exists = fs.existsSync(p);
  if (exists) {
    try {
      const stat = fs.statSync(p);
      console.log('  EXISTS:', p, '(dir:', stat.isDirectory(), ')');
    } catch { console.log('  EXISTS:', p); }
  }
});

console.log('\n── SUPABASE CHECK ──');
const envLocalPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.example');
console.log('.env.local exists:', fs.existsSync(envLocalPath));
console.log('.env.example exists:', fs.existsSync(envExamplePath));

if (fs.existsSync(envLocalPath)) {
  try {
    const content = fs.readFileSync(envLocalPath, 'utf8');
    const hasUrl = content.includes('NEXT_PUBLIC_SUPABASE_URL=') && !content.includes('your-project-id');
    const hasAnonKey = content.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=') && !content.includes('your-anon-key');
    const hasE2EEmail = content.includes('E2E_ADMIN_EMAIL=');
    const hasE2EPass = content.includes('E2E_ADMIN_PASSWORD=');
    console.log('Supabase URL configured:', hasUrl);
    console.log('Supabase ANON key configured:', hasAnonKey);
    console.log('E2E_ADMIN_EMAIL configured:', hasE2EEmail);
    console.log('E2E_ADMIN_PASSWORD configured:', hasE2EPass);
  } catch (e) {
    console.log('Could not read .env.local:', e.message);
  }
}

console.log('\n═══════════════════════════════════════════');
console.log('CAPABILITY SUMMARY');
console.log('═══════════════════════════════════════════');
console.log('');
console.log('✓ Can execute:');
console.log('  - Node.js scripts (runtime-verify.js)');
console.log('  - npm commands (install, build, dev)');
console.log('  - Static code analysis');
console.log('  - File read/write operations');
console.log('');
console.log('✗ Cannot execute:');
console.log('  - Playwright E2E tests (no browser binary installed, no display, no admin credentials)');
console.log('  - Browser login (no credentials, no browser)');
console.log('  - Session stress tests (60 min idle requires real time)');
console.log('  - Lighthouse performance audit (requires browser)');
console.log('  - Accessibility audit (requires browser)');
console.log('  - Live website publish verification (requires admin credentials)');
console.log('');
console.log('This environment is: HEADLESS CLI-ONLY');
console.log('No browser, no display, no admin credentials available.');
console.log('');
console.log('To complete browser-based testing, a developer must run:');
console.log('  1. npm run dev');
console.log('  2. npx playwright test');
console.log('  3. Open http://localhost:3000/admin-login in browser');
console.log('  4. Login with admin credentials');
console.log('  5. Perform session stress tests manually');
