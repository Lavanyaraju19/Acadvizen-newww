require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  
  const tables = ['pages', 'blogs', 'courses', 'tools_extended', 'location_pages'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (data && data.length > 0) {
      console.log(table.toUpperCase() + ' columns: ' + Object.keys(data[0]).join(', '));
    } else if (error) {
      console.log(table.toUpperCase() + ' ERROR: ' + error.message);
    } else {
      console.log(table.toUpperCase() + ': empty table');
    }
  }
  
  // Check if created_by exists
  for (const table of ['pages', 'blogs']) {
    const { data } = await supabase.from(table).select('created_by').limit(1);
    if (data !== undefined) {
      console.log(table + ' has created_by column: YES');
    } else {
      console.log(table + ' has created_by column: NO');
    }
  }
}

main().catch(e => console.error(e.message));
