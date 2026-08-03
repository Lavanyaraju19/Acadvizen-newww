/* Inspect the local (disposable) Supabase instance to see which CMS tables exist. */
const { createClient } = require('@supabase/supabase-js');

const LOCAL_URL = 'http://127.0.0.1:54321';
const LOCAL_SERVICE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const TABLES = [
  'pages', 'blogs', 'sections', 'courses', 'tools_extended', 'city_pages',
  'location_pages', 'redirects', 'seo_metadata', 'profiles', 'roles', 'user_roles',
  'menus', 'header_settings', 'footer_settings', 'site_settings', 'banners',
  'popups', 'forms', 'form_submissions', 'reusable_sections', 'page_templates',
  'drafts', 'home_sections', 'page_sections', 'homepage_settings', 'global_settings',
  'sitemap_settings', 'navigation_menus', 'blog_categories', 'blog_tags', 'authors',
  'page_versions', 'blog_versions',
];

async function main() {
  const supabase = createClient(LOCAL_URL, LOCAL_SERVICE_KEY, { auth: { persistSession: false } });

  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    if (!error) {
      const countRes = await supabase.from(table).select('id', { count: 'exact', head: true });
      const count = countRes.count ?? 0;
      console.log(`  EXISTS: ${table} (${count} rows)`);
    } else {
      console.log(`  ERROR: ${table} - ${error.message}`);
    }
  }

  // Check for the created_by column on pages/blogs
  const { data: blogCols, error: blogColErr } = await supabase.from('blogs').select('*').limit(1);
  if (!blogColErr && blogCols && blogCols[0]) {
    console.log('  blogs sample keys:', Object.keys(blogCols[0]).join(','));
  }
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });

