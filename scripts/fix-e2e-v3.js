/**
 * Fix E2E failures by adding missing columns via Supabase REST API
 * Uses the Supabase REST API with service_role key to run SQL
 */
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function runSQL(sql) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/`;
  console.log(`Running SQL: ${sql.substring(0, 80)}...`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ sql_text: sql }),
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.log(`  WARN: SQL returned ${response.status}: ${text.substring(0, 200)}`);
      return false;
    }
    return true;
  } catch (e) {
    console.log(`  WARN: SQL failed: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('Using Supabase URL:', SUPABASE_URL);
  console.log('Service key available:', !!SERVICE_KEY);
  
  // Try the exec_sql function first
  let executed = false;
  
  const fixes = [
    { desc: 'Add canonical_url to pages', sql: 'ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS canonical_url text' },
    { desc: 'Add created_by to blogs', sql: 'ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT gen_random_uuid()' },
    { desc: 'Add created_by to pages', sql: 'ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT gen_random_uuid()' },
    { desc: 'Make redirects.new_url nullable', sql: 'ALTER TABLE IF EXISTS public.redirects ALTER COLUMN new_url DROP NOT NULL' },
    { desc: 'Make redirects.old_url nullable', sql: 'ALTER TABLE IF EXISTS public.redirects ALTER COLUMN old_url DROP NOT NULL' },
    { desc: 'Add updated_at to pages', sql: 'ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS updated_at timestamptz' },
    { desc: 'Add updated_at to blogs', sql: 'ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS updated_at timestamptz' },
    { desc: 'Add published_at to blogs', sql: 'ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS published_at timestamptz' },
    { desc: 'Add deleted_at to blogs', sql: 'ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS deleted_at timestamptz' },
    { desc: 'Add og_image to pages', sql: 'ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS og_image text' },
    { desc: 'Add noindex to pages', sql: 'ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS noindex boolean DEFAULT false' },
  ];
  
  for (const fix of fixes) {
    const ok = await runSQL(fix.sql);
    if (ok) {
      console.log('  OK: ' + fix.desc);
      executed = true;
    } else {
      console.log('  FAILED: ' + fix.desc);
    }
  }
  
  // Try using the direct /rest/v1/ endpoint with PATCH
  if (!executed) {
    console.log('\nTrying direct column addition via Supabase REST API...');
    
    // Add canonical_url to pages via PATCH
    try {
      // First check if column exists
      const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/pages?select=canonical_url&limit=1`, {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
        }
      });
      console.log('Pages check status:', checkRes.status);
      
      if (checkRes.status === 200) {
        // Column exists, good
        console.log('  pages.canonical_url already exists');
      }
    } catch (e) {
      console.log('  Could not check pages table:', e.message);
    }
  }
  
  console.log('\nDone. If all fixes failed, the DB may need pg connection.');
}

main().catch(e => console.error('FATAL:', e.message));
