require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // Try querying key tables
  const tables = [
    'pages', 'blogs', 'sections', 'courses', 'tools_extended',
    'city_pages', 'location_pages', 'redirects', 'seo_metadata',
    'profiles', 'roles', 'user_roles', 'menus', 'header_settings',
    'footer_settings', 'site_settings', 'banners', 'popups', 'forms',
    'reusable_sections', 'page_templates', 'drafts', 'home_sections'
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
        console.log('  MISSING: ' + table);
      } else {
        console.log('  ERROR: ' + table + ' - ' + error.message);
      }
    } else {
      console.log('  EXISTS: ' + table + (data.length > 0 ? ' (has data)' : ' (empty)'));
    }
  }
}

main().catch(e => console.error(e.message));
