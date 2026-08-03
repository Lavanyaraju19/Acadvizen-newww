const { Client } = require('pg');

async function main() {
  // Use URL-encoded password to avoid shell issues
  const connString = 'postgresql://postgres:Acadvizen%212026Staging@hhfccftkfryesjirauwf.supabase.co:5432/postgres';
  
  console.log('Connecting to staging Supabase (direct pg)...');
  const client = new Client({ connectionString: connString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected!');

  // Check existing tables
  const tables = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`
  );
  console.log('\nExisting tables:');
  for (const t of tables.rows) {
    console.log('  ' + t.table_name);
  }

  // Check if blogs table has created_by
  const blogCols = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'blogs' ORDER BY ordinal_position`
  );
  console.log('\nBlogs columns:');
  for (const c of blogCols.rows) {
    console.log('  ' + c.column_name);
  }

  // Check if pages table has created_by
  const pageCols = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pages' ORDER BY ordinal_position`
  );
  console.log('\nPages columns:');
  for (const c of pageCols.rows) {
    console.log('  ' + c.column_name);
  }

  // Apply fixes
  const fixes = [
    { desc: 'Add created_by to blogs', sql: 'ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL' },
    { desc: 'Add created_by to pages', sql: 'ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL' },
    { desc: 'Add created_by to location_pages', sql: 'ALTER TABLE IF EXISTS public.location_pages ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL' },
    { desc: 'Add created_by to courses', sql: 'ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL' },
    { desc: 'Add created_by to tools_extended', sql: 'ALTER TABLE IF EXISTS public.tools_extended ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL' },
    { desc: 'Ensure pages.created_at', sql: 'ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()' },
    { desc: 'Ensure pages.updated_at', sql: 'ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()' },
    { desc: 'Ensure blogs.created_at', sql: 'ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()' },
    { desc: 'Ensure blogs.updated_at', sql: 'ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()' },
    { desc: 'Create set_updated_at function', sql: `CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;` },
  ];

  for (const fix of fixes) {
    try {
      await client.query(fix.sql);
      console.log('  OK: ' + fix.desc);
    } catch (e) {
      console.log('  WARN: ' + fix.desc + ' - ' + e.message);
    }
  }

  // Re-check blogs columns
  const blogCols2 = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'blogs' ORDER BY ordinal_position`
  );
  console.log('\nBlogs columns after fixes:');
  for (const c of blogCols2.rows) {
    console.log('  ' + c.column_name);
  }

  await client.end();
  console.log('\nDone.');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
