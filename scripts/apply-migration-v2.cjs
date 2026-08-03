const { Client } = require('pg');

async function main() {
  console.log('Connecting to staging Supabase...');
  const client = new Client({
    host: 'hhfccftkfryesjirauwf.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'Acadvizen!2026Staging',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log('Connected.\n');

  // First, add the missing created_by column to blogs
  console.log('Adding created_by column to blogs...');
  try {
    await client.query('ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL');
    console.log('  OK: created_by added to blogs');
  } catch (e) {
    console.log('  WARN: ' + e.message);
  }

  // Add created_by to pages
  console.log('Adding created_by column to pages...');
  try {
    await client.query('ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL');
    console.log('  OK: created_by added to pages');
  } catch (e) {
    console.log('  WARN: ' + e.message);
  }

  // Add created_by to location_pages
  console.log('Adding created_by column to location_pages...');
  try {
    await client.query('ALTER TABLE public.location_pages ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL');
    console.log('  OK: created_by added to location_pages');
  } catch (e) {
    console.log('  WARN: ' + e.message);
  }

  // Add created_by to courses
  console.log('Adding created_by column to courses...');
  try {
    await client.query('ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL');
    console.log('  OK: created_by added to courses');
  } catch (e) {
    console.log('  WARN: ' + e.message);
  }

  // Add created_by to tools_extended
  console.log('Adding created_by column to tools_extended...');
  try {
    await client.query('ALTER TABLE public.tools_extended ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL');
    console.log('  OK: created_by added to tools_extended');
  } catch (e) {
    console.log('  WARN: ' + e.message);
  }

  // Ensure blogs has updated_at trigger
  console.log('Adding updated_at trigger to blogs...');
  try {
    await client.query(`
      CREATE OR REPLACE FUNCTION public.set_updated_at()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$;
    `);
    console.log('  OK: set_updated_at function ensured');
  } catch (e) {
    console.log('  WARN: ' + e.message);
  }

  try {
    const triggerCheck = await client.query(`
      SELECT 1 FROM information_schema.triggers 
      WHERE event_object_table = 'blogs' AND trigger_name = 'set_blogs_updated_at'
    `);
    if (triggerCheck.rows.length === 0) {
      await client.query(`
        CREATE TRIGGER set_blogs_updated_at
        BEFORE UPDATE ON public.blogs
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()
      `);
      console.log('  OK: trigger added to blogs');
    } else {
      console.log('  OK: trigger already exists on blogs');
    }
  } catch (e) {
    console.log('  WARN: ' + e.message);
  }

  // Ensure pages has created_at, updated_at
  console.log('Ensuring pages has created_at, updated_at...');
  try {
    await client.query('ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()');
    await client.query('ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()');
    console.log('  OK: timestamps ensured on pages');
  } catch (e) {
    console.log('  WARN: ' + e.message);
  }

  // List all CMS tables
  const tablesResult = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`
  );
  console.log('\n=== TABLES AFTER MIGRATION ===');
  for (const t of tablesResult.rows) {
    console.log('  ' + t.table_name);
  }

  // Check columns of pages, blogs
  for (const table of ['pages', 'blogs', 'courses', 'tools_extended']) {
    const colsResult = await client.query(
      `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
      [table]
    );
    console.log('\n=== ' + table + ' ===');
    for (const col of colsResult.rows) {
      console.log('  ' + col.column_name + ' ' + col.data_type + (col.is_nullable === 'YES' ? ' NULL' : ' NOT NULL'));
    }
  }

  await client.end();
  console.log('\nDone.');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
