const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://hhfccftkfryesjirauwf.supabase.co';
const SERVICE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY';
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function inspect() {
  const targetTables = [
    'pages','blogs','sections','page_sections','city_pages','location_pages',
    'courses','tools_extended','forms','banners','popups','header_settings',
    'footer_settings','menus','navigation_menus','reusable_sections','reusable_blocks',
    'page_templates','redirects','seo_metadata','profiles','roles','user_roles',
    'site_settings','sitemap_settings','homepage_settings','homepage_hero',
    'homepage_course_highlights','homepage_course_modules','homepage_curriculum',
    'homepage_projects','homepage_partners','homepage_placements','homepage_testimonials',
    'homepage_faq','homepage_tools','homepage_cta','drafts','companies',
    'internships','home_sections','blog_content_blocks'
  ];

  // Use the Supabase REST API directly with service role key to introspect
  // The /rest/v1/ endpoint can handle raw SQL-like queries
  for (const table of targetTables) {
    // Try a simple SELECT to check existence
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
      continue;
    }
    
    // Table exists - now get the actual column names from the data object
    if (data && data.length > 0) {
      const sampleRow = data[0];
      console.log(`\n=== ${table} ===`);
      const colNames = Object.keys(sampleRow);
      for (const col of colNames) {
        const val = sampleRow[col];
        const type = val === null ? 'null' : typeof val;
        const isArr = Array.isArray(val) ? '[]' : '';
        console.log(`  ${col}: ${type}${isArr}${val !== null ? ' = ' + JSON.stringify(val).substring(0, 80) : ' (null)'}`);
      }
    } else {
      console.log(`\n=== ${table} === (empty, no sample data)`);
      // Try to infer columns from select('*')
      const { data: emptyCheck } = await supabase.from(table).select('count').limit(1);
      console.log(`  Count check: ${JSON.stringify(emptyCheck)}`);
    }
  }
}

inspect().catch(e => console.error('Error:', e.message));
