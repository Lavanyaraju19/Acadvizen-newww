const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name, condition) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${name}`);
  } else {
    failedTests++;
    console.log(`  ✗ ${name} -- FAILED`);
  }
}

function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

console.log('\n═══════════════════════════════════════════');
console.log('  SESSION MANAGEMENT VERIFICATION SUITE');
console.log('═══════════════════════════════════════════\n');

// ── STEP 1: Build Verification ──
console.log('── STEP 1: Build Output Verification ──');
const buildIdPath = path.join(ROOT, '.next', 'BUILD_ID');
const buildExists = fs.existsSync(buildIdPath);
test('Build completed (BUILD_ID exists)', buildExists);
if (buildExists) {
  const buildId = fs.readFileSync(buildIdPath, 'utf8').trim();
  test('BUILD_ID is non-empty', buildId.length > 0);
}

// ── STEP 2: SessionManager Singleton ──
console.log('\n── STEP 2: SessionManager Singleton Verification ──');
const smContent = readFile('lib/sessionManager.ts');
test('SessionManager: has private static instance', smContent.includes('private static instance'));
test('SessionManager: has getInstance()', smContent.includes('getInstance'));
test('SessionManager: has private constructor', smContent.includes('private constructor'));
test('SessionManager: has refreshIfNeeded()', smContent.includes('refreshIfNeeded'));
test('SessionManager: has getSessionState()', smContent.includes('getSessionState'));
test('SessionManager: has subscribe()', smContent.includes('subscribe'));
test('SessionManager: has destroy()', smContent.includes('destroy'));
test('SessionManager: has HEARTBEAT_MS = 240_000 (4 min)', smContent.includes('HEARTBEAT_MS = 240_000'));
test('SessionManager: has MAX_REFRESH_RETRIES = 3', smContent.includes('MAX_REFRESH_RETRIES = 3'));
test('SessionManager: has RETRY_BACKOFF_MS', smContent.includes('RETRY_BACKOFF_MS'));
test('SessionManager: has cooldown (10s)', smContent.includes('10_000') || smContent.includes('cooldown'));
test('SessionManager: has visibilitychange listener', smContent.includes('visibilitychange'));
test('SessionManager: has focus listener', smContent.includes("'focus'") || smContent.includes('"focus"'));
test('SessionManager: has online listener', smContent.includes("'online'") || smContent.includes('"online"'));
test('SessionManager: starts heartbeat interval', smContent.includes('startHeartbeat'));
test('SessionManager: exports as singleton instance', smContent.includes('const sessionManager = SessionManager'));
test('SessionManager: handles TOKEN_REFRESHED event', smContent.includes('TOKEN_REFRESHED'));
test('SessionManager: handles SIGNED_OUT event', smContent.includes('SIGNED_OUT'));
test('SessionManager: retry on failed refresh', smContent.includes('this.state.refreshAttempts < this.MAX_REFRESH_RETRIES'));
test('SessionManager: no infinite loop (no while(true))', !smContent.includes('while (true)'));
test('SessionManager: clears interval before creating new one', smContent.includes('clearInterval(this.heartbeatInterval)'));

// ── STEP 3: AdminLayoutClient ──
console.log('\n── STEP 3: AdminLayoutClient Verification ──');
const alcContent = readFile('app/admin/AdminLayoutClient.jsx');
test('AdminLayoutClient: imports sessionManager', alcContent.includes('sessionManager') && alcContent.includes("import"));
test('AdminLayoutClient: imports useRef', alcContent.includes('useRef'));
test('AdminLayoutClient: has RefreshCw icon import', alcContent.includes('RefreshCw'));
test('AdminLayoutClient: calls refreshIfNeeded()', alcContent.includes('sessionManager.refreshIfNeeded'));
test('AdminLayoutClient: has isTransient check', alcContent.includes('isTransient'));
test('AdminLayoutClient: has verifiedOnce guard', alcContent.includes('verifiedOnce'));
test('AdminLayoutClient: transient errors preserve existing state', alcContent.includes("error: ''") && alcContent.includes("Don't show error"));
test('AdminLayoutClient: has verifyAdminAccess function', alcContent.includes('verifyAdminAccess'));

// ── STEP 4: adminApiClient ──
console.log('\n── STEP 4: adminApiClient Verification ──');
const aacContent = readFile('lib/adminApiClient.js');
test('adminApiClient: NO 7-second timeout on getSession', !aacContent.includes('7000'));
test('adminApiClient: has inline refreshSession()', aacContent.includes('supabase.auth.refreshSession'));
test('adminApiClient: handles expired token with refresh token', aacContent.includes('access_token') && aacContent.includes('refresh_token'));
test('adminApiClient: network errors return empty (no side effects)', aacContent.includes("msg.includes('fetch')") || aacContent.includes("msg.includes('network')"));
test('adminApiClient: adminApiFetch has retry logic', aacContent.includes('retries'));
test('adminApiClient: adminApiFetch uses AbortController timeout', aacContent.includes('AbortController'));
test('adminApiClient: has DEFAULT_TIMEOUT_MS = 15000', aacContent.includes('DEFAULT_TIMEOUT_MS = 15000'));

// ── STEP 5: _utils.js (resolveAdminContext) ──
console.log('\n── STEP 5: _utils.js resolveAdminContext Verification ──');
const utilsContent = readFile('app/api/cms/_utils.js');
const lines7000 = utilsContent.split('\n').filter(l => l.includes('7000'));
test('_utils: NO 7-second timeout on getUser()', lines7000.length === 0);
test('_utils: has transient error detection', utilsContent.includes('transient: true'));
test('_utils: has needsRefresh detection', utilsContent.includes('needsRefresh: true'));
test('_utils: transient errors return 503 status', utilsContent.includes('status: 503'));
test('_utils: expired token returns 401 with needsRefresh', utilsContent.includes("'expired'") || utilsContent.includes('"expired"'));
test('_utils: network/timeout errors classified as transient', utilsContent.includes("'timeout'") || utilsContent.includes('"timeout"'));

// ── STEP 6: Environment Configuration ──
console.log('\n── STEP 6: Environment Configuration Verification ──');
const envContent = readFile('lib/env.ts');
test('env.ts: has validateSupabaseConfig()', envContent.includes('validateSupabaseConfig'));
test('env.ts: has export function getEnv()', envContent.includes('export function getEnv'));
test('env.ts: has export function requireEnv()', envContent.includes('export function requireEnv'));
test('env.ts: no hardcoded Supabase keys', !envContent.includes('sbp_') && !envContent.includes('eyJ'));
test('env.ts: uses process.env references', envContent.includes('process.env'));

const nextConfig = readFile('next.config.mjs');
const hasOldEnvBlock = nextConfig.includes("NEXT_PUBLIC_SUPABASE_URL:") && nextConfig.includes("process.env.NEXT_PUBLIC_SUPABASE_URL");
test('next.config.mjs: env block removed (no shadowing)', !hasOldEnvBlock);

// ── STEP 7: Security Verification ──
console.log('\n── STEP 7: Security Verification ──');
const filesToCheck = [
  'lib/env.ts', 'lib/supabaseServer.ts', 'lib/supabaseBrowser.ts',
  'components/AdminLoginForm.jsx', 'middleware.js', 'next.config.mjs',
];
let allSecure = true;
for (const f of filesToCheck) {
  const content = readFile(f);
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      (line.includes("'") || line.includes('"')) &&
      !line.includes('process.env') &&
      !line.includes('SUPABASE_') &&
      !line.includes('NEXT_PUBLIC_') &&
      (line.includes('sbp_') || line.includes('eyJ') || line.includes('service_role'))
    ) {
      console.log(`  ✗ SECURITY: Possible hardcoded credential in ${f}:${i+1}`);
      allSecure = false;
    }
  }
}
test('No hardcoded credentials in any file', allSecure);

const supabaseServer = readFile('lib/supabaseServer.ts');
test('supabaseServer: has preferServiceRole flag', supabaseServer.includes('preferServiceRole'));
test('supabaseServer: warns against auto service role fallback', supabaseServer.includes('NEVER automatically fall back'));
test('supabaseServer: validates anon key', supabaseServer.includes('hasValidSupabaseAnonKey'));
test('supabaseServer: validates service role key', supabaseServer.includes('hasValidSupabaseServiceRoleKey'));

// ── STEP 8: AdminLoginForm ──
console.log('\n── STEP 8: AdminLoginForm Verification ──');
const alfContent = readFile('components/AdminLoginForm.jsx');
test('AdminLoginForm: imports SUPABASE_URL / SUPABASE_ANON_KEY', alfContent.includes('SUPABASE_URL') && alfContent.includes('SUPABASE_ANON_KEY'));
test('AdminLoginForm: has manualPasswordSignIn fallback', alfContent.includes('manualPasswordSignIn'));
test('AdminLoginForm: checks supabase?.auth before use', alfContent.includes('supabase?.auth'));
test('AdminLoginForm: clears session before login attempt', alfContent.includes('signOut'));
test('AdminLoginForm: imports supabase from supabaseClient', alfContent.includes('../lib/supabaseClient'));

// ── STEP 9: AuthContext ──
console.log('\n── STEP 9: AuthContext Verification ──');
const authContextContent = readFile('src/contexts/AuthContext.jsx');
test('AuthContext: has withTimeout helper', authContextContent.includes('withTimeout'));
test('AuthContext: has AUTH_TIMEOUT_MS = 12000', authContextContent.includes('AUTH_TIMEOUT_MS = 12000'));
test('AuthContext: handles supabase being unavailable', authContextContent.includes('if (!supabase)'));

// ── STEP 10: Middleware ──
console.log('\n── STEP 10: Middleware Verification ──');
const mwContent = readFile('middleware.js');
test('middleware: uses @supabase/ssr createServerClient', mwContent.includes('createServerClient'));
test('middleware: reads env vars from process.env', mwContent.includes('process.env.NEXT_PUBLIC_SUPABASE_URL') || mwContent.includes('process.env.NEXT_PUBLIC_SUPABASE'));
test('middleware: skips /admin routes', mwContent.includes("pathname.startsWith('/admin')"));

// ═══════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════
console.log('\n═══════════════════════════════════════════');
console.log('  TEST RESULTS SUMMARY');
console.log('═══════════════════════════════════════════');
console.log(`  Total: ${totalTests}`);
console.log(`  Passed: ${passedTests}`);
console.log(`  Failed: ${failedTests}`);
console.log(`  Pass rate: ${Math.round(passedTests / totalTests * 100)}%`);

const exitCode = failedTests > 0 ? 1 : 0;
console.log(`\n  Verdict: ${exitCode === 0 ? 'ALL CHECKS PASSED ✓' : 'SOME CHECKS FAILED ✗'}`);
process.exit(exitCode);
