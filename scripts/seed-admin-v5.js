/* Connect as supabase_admin to fix constraint and seed admin. */
const { Client } = require('pg');
const http = require('node:http');

async function tryConnectPg(user, password) {
  const c = new Client({
    host: '127.0.0.1', port: 54322,
    user, password, database: 'postgres',
    connectionTimeoutMillis: 5000,
  });
  try {
    await c.connect();
    return c;
  } catch (e) {
    try { await c.end(); } catch {}
    return null;
  }
}

async function main() {
  // Try different users
  const creds = [
    ['supabase_admin', 'postgres'],
    ['supabase_admin', ''],
    ['supabase_admin', 'supabase'],
    ['postgres', 'postgres'],
  ];

  let pg = null;
  for (const [u, p] of creds) {
    pg = await tryConnectPg(u, p);
    if (pg) { console.log(`Connected as ${u}`); break; }
  }

  if (!pg) {
    console.log('Cannot connect to Postgres. Trying Supabase REST SQL API...');
    
    // Try using the Supabase SQL endpoint
    const http = require('node:http');
    const sql = "ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check; ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('super_admin','admin','editor','author','viewer','seo_manager','content_writer','user','student','manager','reviewer','pending'));";
    
    // Actually, we can't use SQL API directly. Let's try the Supabase CLI if available
    const { execSync } = require('node:child_process');
    try {
      console.log('Trying supabase CLI...');
      const result = execSync('supabase db execute --db-url "postgresql://postgres:postgres@127.0.0.1:54322/postgres" "ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check"', { timeout: 10000, encoding: 'utf8', shell: true });
      console.log('Result:', result);
    } catch (e) {
      console.log('Supabase CLI not available:', e.message.slice(0, 100));
    }
    
    process.exit(1);
  }

  try {
    // Check current constraint
    const constraints = await pg.query(
      "SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid = 'public.profiles'::regclass AND conname = 'profiles_role_check'"
    );
    console.log('Current constraint:', constraints.rows[0]?.def || 'none');

    // Drop and recreate
    await pg.query("ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check");
    await pg.query(`ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
      CHECK (role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'editor'::text, 'author'::text, 'viewer'::text, 'seo_manager'::text, 'content_writer'::text, 'user'::text, 'student'::text, 'manager'::text, 'reviewer'::text, 'pending'::text]))`);
    console.log('Constraint updated successfully');
  } catch (e) {
    console.log('Error updating constraint:', e.message.slice(0, 200));
  }

  await pg.end();

  // Now try signup
  console.log('\nSigning up admin user...');
  const ANON_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY';
  const SERVICE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

  function httpReq(url, method, headers, body) {
    return new Promise((resolve, reject) => {
      const u = new URL(url);
      const opts = {
        hostname: u.hostname, port: u.port, path: u.pathname,
        method, headers: { 'Content-Type': 'application/json', ...headers },
        timeout: 10000,
      };
      const req = http.request(opts, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, data }); }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  const signupRes = await httpReq(
    'http://127.0.0.1:54321/auth/v1/signup',
    'POST',
    { 'apikey': ANON_KEY },
    { email: 'admin@acadvizen.com', password: process.env.ADMIN_PASSWORD, data: { role: 'super_admin' } }
  );
  console.log('Signup response:', signupRes.status, JSON.stringify(signupRes.data).slice(0, 300));

  if (signupRes.status === 200 || signupRes.status === 201) {
    const userId = signupRes.data?.id || signupRes.data?.user?.id || '';
    console.log('User ID:', userId);

    if (userId) {
      // Update profile
      const updateRes = await httpReq(
        `http://127.0.0.1:54321/rest/v1/profiles?id=eq.${userId}`,
        'PATCH',
        { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Prefer': 'return=representation' },
        { role: 'super_admin', full_name: 'Admin User' }
      );
      console.log('Profile update:', updateRes.status, JSON.stringify(updateRes.data).slice(0, 200));

      // Assign role
      const rolesRes = await httpReq(
        'http://127.0.0.1:54321/rest/v1/roles?slug=eq.super_admin&select=id',
        'GET',
        { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
      );
      if (rolesRes.data?.length) {
        const roleId = rolesRes.data[0].id;
        const assignRes = await httpReq(
          'http://127.0.0.1:54321/rest/v1/user_roles',
          'POST',
          { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Prefer': 'return=representation' },
          { user_id: userId, role_id: roleId }
        );
        console.log('Role assignment:', assignRes.status, JSON.stringify(assignRes.data).slice(0, 200));
      }
    }
  }

  console.log('\nDone. Try logging in at http://127.0.0.1:3000/admin-login');
  console.log('Email: admin@acadvizen.com / Password: (see ADMIN_PASSWORD env)');
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
