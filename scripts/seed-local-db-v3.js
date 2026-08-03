/* Seed admin user directly into the local Postgres. */
const { Client } = require('pg');

const DB = {
  host: '127.0.0.1', port: 54322, user: 'postgres',
  password: 'postgres', database: 'postgres',
  connectionTimeoutMillis: 15000,
};

const SQL = `
-- Check profile columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema='public' AND table_name='profiles' ORDER BY column_name;

-- Check if auth schema exists
SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') as auth_exists;
`;

async function main() {
  const client = new Client(DB);
  await client.connect();

  const res = await client.query(SQL);
  console.log('Profiles columns:');
  for (const row of res[0].rows) {
    console.log(`  ${row.column_name}: ${row.data_type}`);
  }
  console.log('Auth schema exists:', res[1].rows[0].auth_exists);

  if (res[1].rows[0].auth_exists) {
    const authUsers = await client.query("SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5");
    console.log('\nAuth users:');
    for (const u of authUsers.rows) {
      console.log(`  ${u.id}: ${u.email}`);
    }
  }

  // Try to insert into auth.users directly
  const { randomUUID } = require('node:crypto');
  const userId = randomUUID();
  const email = 'admin@acadvizen.com';
  const hashedPassword = '$2a$10$PlaceholderHashForAdmin123456789012345678901234567890'; // Not a real hash, but let's try

  try {
    // Check if auth schema has users table
    const authTables = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='auth' ORDER BY table_name"
    );
    console.log('\nAuth tables:', authTables.rows.map(r => r.table_name).join(', '));
  } catch (e) {
    console.log('Cannot list auth tables:', e.message);
  }

  await client.end();
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
