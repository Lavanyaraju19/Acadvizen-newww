/* Seed admin via Supabase REST API & direct SQL with supabase_admin. */
const http = require('node:http');
const { Client } = require('pg');

const SUPABASE_URL = 'http://127.0.0.1:54321';
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

async function main() {
  console.log('Step 1: Fix profiles constraint via direct Postgres...');
  const pg = new Client({
    host: '127.0.0.1', port: 54322, user: 'postgres',
    password: 'postgres', database: 'postgres',
    connectionTimeoutMillis: 6000,
  });
  await pg.connect();

  try {
    await pg.query("GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres");
    await pg.query("ALTER TABLE public.profiles OWNER TO postgres");
    console.log('Changed profiles owner to postgres');
  } catch (e) {
    console.log('Cannot change owner:', e.message.slice(0, 100));
  }

  try {
    await pg.query("ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check");
    await pg.query(`ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
      CHECK (role IN ('super_admin', 'admin', 'editor', 'author', 'viewer', 'seo_manager', 'content_writer', 'user', 'student', 'manager', 'reviewer', 'pending'))`);
    console.log('Updated profiles_role_check constraint');
  } catch (e) {
    console.log('Cannot update constraint:', e.message.slice(0, 100));
  }

  await pg.end();

  console.log('\nStep 2: Sign up admin user via GoTrue...');
  const signupRes = await httpReq(
    `${SUPABASE_URL}/auth/v1/signup`,
    'POST',
    { 'apikey': ANON_KEY },
    { email: 'admin@acadvizen.com', password: process.env.ADMIN_PASSWORD, data: { role: 'super_admin' } }
  );
  console.log('Signup response:', signupRes.status, JSON.stringify(signupRes.data).slice(0, 200));

  if (signupRes.status === 200) {
    const userId = signupRes.data?.id || '';
    console.log('User ID:', userId);

    // Update profile to super_admin
    const updateRes = await httpReq(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
      'PATCH',
      { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Prefer': 'return=representation' },
      { role: 'super_admin', full_name: 'Admin User' }
    );
    console.log('Profile update:', updateRes.status, JSON.stringify(updateRes.data).slice(0, 200));

    // Assign role
    const { data: roles } = await httpReq(
      `${SUPABASE_URL}/rest/v1/roles?slug=eq.super_admin&select=id`,
      'GET',
      { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
    );
    if (roles.data?.length) {
      const roleId = roles.data[0].id;
      const assignRes = await httpReq(
        `${SUPABASE_URL}/rest/v1/user_roles`,
        'POST',
        { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Prefer': 'return=representation' },
        { user_id: userId, role_id: roleId }
      );
      console.log('Role assignment:', assignRes.status, JSON.stringify(assignRes.data).slice(0, 200));
    }
  }

  console.log('\nDone. Try logging in at http://127.0.0.1:3000/admin-login');
  console.log('Email: admin@acadvizen.com');
  console.log('Password: (see ADMIN_PASSWORD env)');
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
