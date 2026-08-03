/* Fix all database issues found during E2E testing. */
const { Client } = require('pg');

async function main() {
  const pg = new Client({
    host: '127.0.0.1', port: 54322,
    user: 'supabase_admin', password: 'postgres',
    database: 'postgres',
    connectionTimeoutMillis: 10000,
  });
  await pg.connect();
  console.log('Connected.');

  // 1. Add approval_status to profiles
  console.log('\n1. Fixing profiles table...');
  try {
    const cols = await pg.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles'`
    );
    const profileCols = cols.rows.map(r => r.column_name);
    console.log('   Existing profile columns:', profileCols.join(', '));

    if (!profileCols.includes('approval_status')) {
      await pg.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'approved'`);
      console.log('   Added approval_status to profiles');
    }
    if (!profileCols.includes('full_name')) {
      await pg.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text`);
      console.log('   Added full_name to profiles');
    }
    if (!profileCols.includes('avatar_url')) {
      await pg.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text`);
      console.log('   Added avatar_url to profiles');
    }
  } catch (e) {
    console.log('   Error:', e.message.slice(0, 100));
  }

  // 2. Fix redirects table - add old_url column
  console.log('\n2. Fixing redirects table...');
  try {
    const redirectCols = await pg.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='redirects'`
    );
    const rCols = redirectCols.rows.map(r => r.column_name);
    console.log('   Existing redirect columns:', rCols.join(', '));

    if (!rCols.includes('old_url')) {
      await pg.query(`ALTER TABLE public.redirects ADD COLUMN IF NOT EXISTS old_url text`);
      console.log('   Added old_url to redirects');
    }
    if (!rCols.includes('new_url')) {
      await pg.query(`ALTER TABLE public.redirects ADD COLUMN IF NOT EXISTS new_url text`);
      console.log('   Added new_url to redirects');
    }
    // Make old_url nullable
    try {
      await pg.query(`ALTER TABLE public.redirects ALTER COLUMN old_url DROP NOT NULL`);
      console.log('   Made old_url nullable');
    } catch (e) {
      console.log('   old_url drop not null:', e.message.slice(0, 100));
    }
    try {
      await pg.query(`ALTER TABLE public.redirects ALTER COLUMN from_path DROP NOT NULL`);
      console.log('   Made from_path nullable');
    } catch (e) {
      console.log('   from_path drop not null:', e.message.slice(0, 100));
    }
  } catch (e) {
    console.log('   Error:', e.message.slice(0, 100));
  }

  // 3. Fix the admin login - ensure the user exists in auth.users
  console.log('\n3. Checking admin user...');
  const adminUser = await pg.query(
    `SELECT id, email FROM auth.users WHERE email = 'admin@acadvizen.com'`
  );
  if (adminUser.rows.length === 0) {
    console.log('   Admin user not found in auth.users! Need to create.');
  } else {
    console.log('   Admin user found:', adminUser.rows[0].id);
    
    // Ensure profile is complete
    await pg.query(
      `UPDATE public.profiles SET role = 'super_admin', full_name = 'Admin User', approval_status = 'approved' WHERE id = $1`,
      [adminUser.rows[0].id]
    );
    console.log('   Profile updated');
  }

  await pg.end();
  console.log('\nDone fixing E2E issues.');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
