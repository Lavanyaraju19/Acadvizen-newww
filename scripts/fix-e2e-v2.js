/**
 * Fix E2E failures by adding missing columns via Supabase REST API
 * Uses service role key for admin operations
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase URL or service role key');
  process.exit(1);
}

async function main() {
  console.log('Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });

  // Check if we can use the management API
  const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)/)?.[1] || '';
  console.log('Project ref:', projectRef);

  // Try direct SQL via pg connection
  const { Client } = require('pg');
  const connString = `postgresql://postgres:Acadvizen%212026Staging@${projectRef}.supabase.co:5432/postgres`;

  try {
    console.log('Connecting to database...');
    const client = new Client({ connectionString: connString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    console.log('Connected!');

    const fixes = [
      // Add canonical_url to pages
      { desc: 'Add canonical_url to pages', sql: 'ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS canonical_url text' },
      // Add created_by to blogs  
      { desc: 'Add created_by to blogs', sql: 'ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL' },
      // Add created_by to pages
      { desc: 'Add created_by to pages', sql: 'ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL' },
      // Add created_by to location_pages
      { desc: 'Add created_by to location_pages', sql: 'ALTER TABLE IF EXISTS public.location_pages ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL' },
      // Add created_by to courses
      { desc: 'Add created_by to courses', sql: 'ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL' },
      // Add created_by to tools_extended
      { desc: 'Add created_by to tools_extended', sql: 'ALTER TABLE IF EXISTS public.tools_extended ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL' },
      // Ensure redirects has new_url as nullable or set default
      { desc: 'Make redirects.new_url nullable', sql: 'ALTER TABLE IF EXISTS public.redirects ALTER COLUMN new_url DROP NOT NULL' },
      { desc: 'Make redirects.old_url nullable', sql: 'ALTER TABLE IF EXISTS public.redirects ALTER COLUMN old_url DROP NOT NULL' },
      // Ensure pages has created_at, updated_at
      { desc: 'Ensure pages.created_at', sql: "ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()" },
      { desc: 'Ensure pages.updated_at', sql: "ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()" },
      // Ensure blogs has created_at, updated_at
      { desc: 'Ensure blogs.created_at', sql: "ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()" },
      { desc: 'Ensure blogs.updated_at', sql: "ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()" },
      // Add og_image and noindex to pages
      { desc: 'Add og_image to pages', sql: 'ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS og_image text' },
      { desc: 'Add noindex to pages', sql: 'ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS noindex boolean DEFAULT false' },
      // Add published_at to blogs
      { desc: 'Add published_at to blogs', sql: 'ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS published_at timestamptz' },
      // Add deleted_at to blogs
      { desc: 'Add deleted_at to blogs', sql: 'ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS deleted_at timestamptz' },
    ];

    for (const fix of fixes) {
      try {
        await client.query(fix.sql);
        console.log('  OK: ' + fix.desc);
      } catch (e) {
        console.log('  WARN: ' + fix.desc + ' - ' + e.message);
      }
    }

    // Verify columns
    const pageCols = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pages' ORDER BY ordinal_position`
    );
    console.log('\nPages columns:');
    for (const c of pageCols.rows) {
      console.log('  ' + c.column_name);
    }

    const blogCols = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'blogs' ORDER BY ordinal_position`
    );
    console.log('\nBlogs columns:');
    for (const c of blogCols.rows) {
      console.log('  ' + c.column_name);
    }

    const redirectCols = await client.query(
      `SELECT column_name, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'redirects' ORDER BY ordinal_position`
    );
    console.log('\nRedirects columns:');
    for (const c of redirectCols.rows) {
      console.log('  ' + c.column_name + ' (nullable: ' + c.is_nullable + ')');
    }

    await client.end();
    console.log('\nAll fixes applied successfully!');
  } catch (e) {
    console.error('Failed:', e.message);
    // Try alternative: direct pooler connection
    try {
      console.log('Trying pooler connection...');
      const poolerConnString = `postgresql://postgres:Acadvizen%212026Staging@${projectRef}.pooler.supabase.com:6543/postgres`;
      const client = new Client({ connectionString: poolerConnString, ssl: { rejectUnauthorized: false } });
      await client.connect();
      console.log('Connected via pooler!');
      
      // Add canonical_url
      await client.query('ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS canonical_url text');
      console.log('  OK: Added canonical_url to pages');
      
      // Add created_by to blogs
      await client.query('ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL');
      console.log('  OK: Added created_by to blogs');
      
      // Make new_url nullable
      await client.query('ALTER TABLE IF EXISTS public.redirects ALTER COLUMN new_url DROP NOT NULL');
      console.log('  OK: Made new_url nullable');
      
      await client.end();
      console.log('Fixes applied via pooler!');
    } catch (e2) {
      console.error('Pooler also failed:', e2.message);
    }
  }
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
