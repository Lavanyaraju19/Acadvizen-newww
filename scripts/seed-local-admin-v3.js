/* Seed admin user via direct HTTP to local Supabase GoTrue. */
const http = require('node:http');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY';
const ANON_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

function httpRequest(url, method, headers, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      timeout: 10000,
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data: data }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const email = 'admin@acadvizen.com';
  const password = process.env.ADMIN_PASSWORD;

  // Try signup via GoTrue API
  console.log('Signing up user via GoTrue...');
  const signupRes = await httpRequest(
    `${SUPABASE_URL}/auth/v1/signup`,
    'POST',
    { 'apikey': ANON_KEY },
    { email, password, data: { role: 'admin' } }
  );
  console.log('Signup response:', signupRes.status, JSON.stringify(signupRes.data).slice(0, 200));

  // Try to get the user
  console.log('\nListing users...');
  const usersRes = await httpRequest(
    `${SUPABASE_URL}/auth/v1/admin/users`,
    'GET',
    { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
  );
  console.log('Users response:', usersRes.status, JSON.stringify(usersRes.data).slice(0, 300));

  // Try using the service client to create user
  console.log('\nTrying supabase admin client...');
  const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data, error } = await serviceClient.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (error) {
      console.log('Admin createUser error:', error.message);
    } else {
      console.log('Admin createUser success:', data?.user?.id);
    }
  } catch (e) {
    console.log('Admin createUser exception:', e.message);
  }

  // Try listing users
  try {
    const { data, error } = await serviceClient.auth.admin.listUsers();
    if (error) {
      console.log('List users error:', error.message);
    } else {
      console.log('Users found:', data?.users?.length || 0);
      for (const u of data?.users || []) {
        console.log(`  ${u.id}: ${u.email}`);
      }
    }
  } catch (e) {
    console.log('List users exception:', e.message);
  }

  // If we got a user via signup, create the profile
  const { data: { users } } = await serviceClient.auth.admin.listUsers().catch(() => ({ data: { users: [] } }));
  const adminUser = users?.find(u => u.email === email);
  if (adminUser) {
    console.log('\nCreating profile for', adminUser.id);
    // Check profile columns first
    const { data: cols } = await serviceClient.from('profiles').select('*').limit(1);
    console.log('Profile columns:', cols ? Object.keys(cols[0] || {}).join(', ') : 'no data');

    // Try with just the columns that exist
    const profileData = {
      id: adminUser.id,
      email: email,
      role: 'super_admin',
      full_name: 'Admin User',
    };
    const { error: profError } = await serviceClient.from('profiles').upsert(profileData, { onConflict: 'id' });
    if (profError) {
      console.log('Profile error:', profError.message);
      // Try without upsert
      const { error: insError } = await serviceClient.from('profiles').insert(profileData);
      if (insError) console.log('Insert error:', insError.message);
      else console.log('Profile inserted');
    } else {
      console.log('Profile upserted');
    }

    // Assign role
    const { data: roles } = await serviceClient.from('roles').select('id').eq('slug', 'super_admin');
    if (roles?.length) {
      await serviceClient.from('user_roles').upsert({
        user_id: adminUser.id, role_id: roles[0].id,
      }, { onConflict: 'user_id,role_id' });
      console.log('Role assigned');
    }
  }

  console.log('\nDone. Try logging in with:', email, '/', password);
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
