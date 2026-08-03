const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'hhfccftkfryesjirauwf.supabase.co',
    port: 5432,
    user: 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log('Connected.');

  // List key CMS tables
  const tablesResult = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_type = 'BASE TABLE' ORDER BY table_name`,
    ['public']
  );
  console.log('\n=== EXISTING TABLES ===');
  for (const t of tablesResult.rows) {
    console.log('  ' + t.table_name);
  }

  // Check columns for pages, blogs, sections
  const keyTables = ['pages', 'blogs', 'sections', 'courses', 'tools_extended', 'location_pages'];
  for (const table of keyTables) {
    // Check if table exists
    const exists = tablesResult.rows.some(r => r.table_name === table);
    if (!exists) {
      console.log('\n=== ' + table + ' === DOES NOT EXIST');
      continue;
    }
    const colsResult = await client.query(
      `SELECT column_name, data_type, is_nullable, column_default 
       FROM information_schema.columns 
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      [table]
    );
    console.log('\n=== ' + table + ' ===');
    for (const col of colsResult.rows) {
      console.log('  ' + col.column_name + ' ' + col.data_type + (col.is_nullable === 'YES' ? ' NULL' : ' NOT NULL'));
    }
  }

  // RLS policies
  console.log('\n=== RLS POLICIES ===');
  const policiesResult = await client.query(
    `SELECT tablename, policyname, cmd, qual 
     FROM pg_policies WHERE schemaname = 'public' 
     ORDER BY tablename, policyname`
  );
  for (const p of policiesResult.rows) {
    console.log('  ' + p.tablename + ': ' + p.policyname + ' (' + p.cmd + ')');
  }

  await client.end();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
