require('dotenv').config({path: require('path').join(__dirname, '..', '.env.local')});
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log('URL:', url);
  
  const s = createClient(url, key, { auth: { persistSession: false } });
  
  // Check if exec_sql RPC exists
  try {
    const { data, error } = await s.rpc('exec_sql', { query: 'SELECT 1 as test' });
    console.log('exec_sql test:', JSON.stringify(data), error?.message);
  } catch(e) {
    console.log('exec_sql not available:', e.message);
  }
  
  // Try direct query on blogs table
  try {
    const { data, error } = await s.from('blogs').select('id,slug,title,status,created_by,created_at,updated_at,published_at,deleted_at').limit(5);
    console.log('Blogs direct:', JSON.stringify(data));
    console.log('Blogs error:', error?.message);
    if (error && error.message.includes('created_by')) {
      console.log('created_by column missing from schema cache');
    }
  } catch(e) {
    console.log('Blogs query failed:', e.message);
  }
  
  // Try pages table
  try {
    const { data, error } = await s.from('pages').select('id,slug,title,status,created_by,created_at,updated_at,published_at,deleted_at').limit(5);
    console.log('Pages direct:', JSON.stringify(data));
    console.log('Pages error:', error?.message);
  } catch(e) {
    console.log('Pages query failed:', e.message);
  }
  
  // List all tables
  try {
    const { data, error } = await s.from('_tables').select('*');
    console.log('Tables:', JSON.stringify(data));
    console.log('Tables error:', error?.message);
  } catch(e) {
    console.log('Tables query failed:', e.message);
  }
}

main().catch(console.error);
