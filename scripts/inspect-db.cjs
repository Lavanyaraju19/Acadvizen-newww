const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://hhfccftkfryesjirauwf.supabase.co';
const SERVICE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY';
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function inspect() {
  // List all tables in public schema
  const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', { 
    sql: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name` 
  });
  
  if (tablesError) {
    console.log('ERROR listing tables:', tablesError.message);
    // Try direct SQL query
    const { data: dt, error: de } = await supabase.from('_prisma_migrations').select('*').limit(1).maybeSingle();
    console.log('Prisma test:', de?.message || 'OK');
  }
  
  if (tables) {
    console.log('\n=== ALL PUBLIC TABLES ===');
    for (const t of tables) console.log('  ' + t.table_name);
  }

  // Get columns for all CMS tables
  const targetTables = [
    'pages','blogs','sections','page_sections','city_pages','location_pages',
    'courses','tools_extended','forms','banners','popups','header_settings',
    'footer_settings','menus','navigation_menus','reusable_sections','reusable_blocks',
    'page_templates','redirects','seo_metadata','profiles','roles','user_roles',
    'site_settings','sitemap_settings','homepage_settings','homepage_hero',
    'homepage_course_highlights','homepage_course_modules','homepage_curriculum',
    'homepage_projects','homepage_partners','homepage_placements','homepage_testimonials',
    'homepage_faq','homepage_tools','homepage_cta','drafts','companies',
    'internships','home_sections','blog_content_blocks','location_pages'
  ];

  // Try direct table queries to see what exists
  for (const table of targetTables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`\n❌ ${table}: ${error.message}`);
    } else {
      console.log(`\n=== ${table} === EXISTS`);
      // Get column info via a different approach
      const { data: colInfo } = await supabase.rpc('exec_sql', {
        sql: `SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${table}' ORDER BY ordinal_position`
      });
      if (colInfo) {
        for (const col of colInfo) {
          console.log(`  ${col.column_name} ${col.data_type}${col.is_nullable==='YES'?' NULL':' NOT NULL'}${col.column_default ? ' DEFAULT '+col.column_default : ''}`);
        }
      } else {
        console.log('  (no column info available)');
      }
    }
  }
}

inspect().catch(e => console.error('Error:', e.message));
