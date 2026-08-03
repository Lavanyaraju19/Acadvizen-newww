require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Service key present:', !!serviceKey);
  
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  
  // Test basic connection
  try {
    const { data, error } = await supabase.from('blogs').select('id').limit(1);
    console.log('Blogs test:', error?.message || 'OK - ' + (data?.length || 0) + ' rows');
  } catch(e) {
    console.log('Blogs test error:', e.message);
  }
  
  // Try to use Supabase Management API
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];
  console.log('Project ref:', projectRef);
  
  // Since we can't use exec_sql, let's try to use the Supabase API to alter tables
  // by using the auth schema and the raw SQL endpoint
  const mgmtKey = process.env.SUPABASE_MANAGEMENT_API_KEY || '';
  
  if (mgmtKey) {
    console.log('Using Management API...');
    try {
      const sql = `
        ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
        ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
        ALTER TABLE IF EXISTS public.location_pages ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
        ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
        ALTER TABLE IF EXISTS public.tools_extended ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
      `;
      const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mgmtKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      });
      const result = await response.json();
      console.log('Management API result:', JSON.stringify(result));
    } catch(e) {
      console.log('Management API error:', e.message);
    }
  } else {
    console.log('No SUPABASE_MANAGEMENT_API_KEY available.');
    console.log('Please run the following SQL in Supabase Dashboard SQL Editor:');
    console.log(`
ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.location_pages ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.tools_extended ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    `);
  }
}

main().catch(console.error);
