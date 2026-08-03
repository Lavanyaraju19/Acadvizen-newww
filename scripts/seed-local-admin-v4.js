/* Fix profiles constraint and seed admin. */
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const DB = {
  host: '127.0.0.1', port: 54322, user: 'postgres',
  password: 'postgres', database: 'postgres',
  connectionTimeoutMillis: 15000,
};

async function main() {
  const pg = new Client(DB);
  await pg.connect();
  console.log('Connected to Postgres.');

  // Fix the profiles check constraint
  console.log('\nChecking profiles constraints...');
  const constraints = await pg.query(`
    SELECT conname, pg_get_constraintdef(oid) as def
    FROM pg_constraint WHERE conrelid = 'public.profiles'::regclass
  `);
  for (const c of constraints.rows) {
    console.log(`  ${c.conname}: ${c.def}`);
  }

  // Drop and recreate the constraint to allow 'super_admin' and 'user' roles
  await pg.query(`
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  `);
  console.log('Dropped old profiles_role_check');

  await pg.query(`
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('super_admin', 'admin', 'editor', 'author', 'viewer', 'seo_manager', 'content_writer', 'user', 'student', 'manager', 'reviewer'));
  `);
  console.log('Added new profiles_role_check');

  await pg.end();

  // Now try signup via Supabase client
  console.log('\nSigning up admin user...');
  const anonClient = createClient(
    'http://127.0.0.1:54321',
    'process.env.SUPABASE_SERVICE_ROLE_KEY',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
    email: 'admin@acadvizen.com',
    password: process.env.ADMIN_PASSWORD,
    options: { data: { role: 'super_admin' } }
  });

  if (signUpError) {
    console.error('Signup error:', signUpError.message);
  } else {
    console.log('Signup success:', signUpData?.user?.id);
  }

  // Now use service role to assign admin role
  const serviceClient = createClient(
    'http://127.0.0.1:54321',
    'process.env.SUPABASE_SERVICE_ROLE_KEY',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // List users to find the admin
  const { data: { users } } = await serviceClient.auth.admin.listUsers().catch(() => ({ data: { users: [] } }));
  const adminUser = users?.find(u => u.email === 'admin@acadvizen.com');
  if (adminUser) {
    console.log('Found admin user:', adminUser.id);

    // Update profile to super_admin
    const { error: profError } = await serviceClient
      .from('profiles')
      .update({ role: 'super_admin' })
      .eq('id', adminUser.id);
    if (profError) console.error('Profile update error:', profError.message);
    else console.log('Profile updated to super_admin');

    // Assign role
    const { data: roles } = await serviceClient.from('roles').select('id').eq('slug', 'super_admin');
    if (roles?.length) {
      const { error: urError } = await serviceClient
        .from('user_roles')
        .upsert({ user_id: adminUser.id, role_id: roles[0].id }, { onConflict: 'user_id,role_id' });
      if (urError) console.error('User role error:', urError.message);
      else console.log('Role assigned');
    }
  } else {
    console.log('No admin user found in auth.users after signup.');
  }

  console.log('\nDone. Admin login: admin@acadvizen.com / (see ADMIN_PASSWORD env)');
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
