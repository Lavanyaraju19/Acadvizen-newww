/* Fix the admin profile via direct SQL */
const { Client } = require('pg');

async function main() {
  const pg = new Client({
    host: '127.0.0.1', port: 54322,
    user: 'supabase_admin', password: 'postgres',
    database: 'postgres',
    connectionTimeoutMillis: 5000,
  });
  await pg.connect();
  console.log('Connected');

  // Find the admin user
  const users = await pg.query("SELECT id, email FROM auth.users WHERE email = 'admin@acadvizen.com'");
  if (users.rows.length === 0) {
    console.log('Admin user not found in auth.users');
    await pg.end();
    return;
  }
  const userId = users.rows[0].id;
  console.log('Admin user ID:', userId);

  // Update profile
  const result = await pg.query(
    "UPDATE public.profiles SET role = 'super_admin', full_name = 'Admin User', updated_at = now() WHERE id = $1",
    [userId]
  );
  console.log('Profile updated:', result.rowCount, 'rows');

  // Check what we have
  const profile = await pg.query("SELECT id, role, full_name FROM public.profiles WHERE id = $1", [userId]);
  console.log('Profile:', JSON.stringify(profile.rows[0]));

  await pg.end();
  console.log('Done');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
