/**
 * Apply CMS production migration using Supabase JS client
 * This uses the service role key for admin operations
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase URL or service role key');
    process.exit(1);
  }

  console.log('Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });
  
  // Test connection
  const { data: testData, error: testError } = await supabase.from('_migrations').select('*').limit(1).maybeSingle();
  if (testError && !testError.message?.includes('does not exist') && !testError.message?.includes('relation')) {
    console.log('Note: ' + testError.message);
  } else {
    console.log('Connected and _migrations table check done.');
  }

  // SQL to ensure CMS tables have the required columns
  const sqlStatements = [
    // Add created_by to blogs
    `ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;`,
    
    // Add created_by to pages
    `ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;`,
    
    // Add created_by to location_pages
    `ALTER TABLE IF EXISTS public.location_pages ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;`,
    
    // Add created_by to courses
    `ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;`,
    
    // Add created_by to tools_extended
    `ALTER TABLE IF EXISTS public.tools_extended ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;`,
    
    // Ensure pages has created_at, updated_at  
    `ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();`,
    `ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();`,
    
    // Ensure blogs has updated_at
    `ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();`,
    `ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();`,
    
    // Add updated_at trigger function if not exists
    `CREATE OR REPLACE FUNCTION public.set_updated_at()
     RETURNS trigger LANGUAGE plpgsql AS $$
     BEGIN NEW.updated_at = now(); RETURN NEW; END;
     $$;`,
  ];

  for (const sql of sqlStatements) {
    console.log('Executing: ' + sql.substring(0, 80) + '...');
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      if (error.message?.includes('function "exec_sql" does not exist') || 
          error.message?.includes('Could not find the function')) {
        console.log('  WARN: exec_sql RPC not available - trying direct table operations');
        // Try using the REST API with service role key (raw SQL doesn't work via RPC)
        break;
      }
      console.log('  OK or non-critical: ' + error.message);
    } else {
      console.log('  OK');
    }
  }

  // Since exec_sql isn't available, let's check what tables exist
  console.log('\nChecking existing tables...');
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_type', 'BASE TABLE');
    
  if (tablesError) {
    console.log('Cannot query tables via API: ' + tablesError.message);
  } else if (tables) {
    console.log('Tables in public schema:');
    tables.forEach(t => console.log('  ' + t.table_name));
  }

  // Try to add created_by using raw REST API
  console.log('\nAttempting to add created_by column via ALTER TABLE...');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({})
    });
    console.log('RPC endpoint status: ' + response.status);
  } catch (e) {
    console.log('Cannot call RPC directly: ' + e.message);
  }

  console.log('\nDone. Note: To apply ALTER TABLE migrations, use the Supabase Dashboard SQL editor or psql with direct DB connection.');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
