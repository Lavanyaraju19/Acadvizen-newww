const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const CONNECTION_STRING = 'postgresql://postgres:Acadvizen%212026Staging@hhfccftkfryesjirauwf.supabase.co:5432/postgres';

async function main() {
  const client = new Client({ connectionString: CONNECTION_STRING, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to staging Supabase.');

  // Step 1: List all tables
  const tablesResult = await client.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  const existingTables = new Set(tablesResult.rows.map(r => r.table_name));
  console.log('\n=== EXISTING TABLES ===');
  for (const t of tablesResult.rows) {
    console.log('  ' + t.table_name);
  }

  // Step 2: Check for missing CMS tables
  const neededTables = [
    'pages','blogs','sections','page_sections','city_pages','location_pages',
    'courses','tools_extended','forms','banners','popups','header_settings',
    'footer_settings','menus','navigation_menus','reusable_sections','reusable_blocks',
    'page_templates','redirects','seo_metadata','profiles','roles','user_roles',
    'site_settings','site_config','homepage_settings','drafts','companies',
    'internships','home_sections','blog_content_blocks','content_blocks'
  ];

  console.log('\n=== MISSING TABLES ===');
  for (const tbl of neededTables) {
    if (!existingTables.has(tbl)) console.log('  MISSING: ' + tbl);
  }

  // Step 3: Check columns on key CMS tables  
  const keyTables = ['pages', 'blogs', 'sections', 'location_pages', 'courses', 'tools_extended'];
  for (const table of keyTables) {
    if (!existingTables.has(table)) {
      console.log('\n=== ' + table + ' === DOES NOT EXIST');
      continue;
    }
    const colsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [table]);
    console.log('\n=== ' + table + ' ===');
    for (const col of colsResult.rows) {
      console.log('  ' + col.column_name + ' ' + col.data_type + (col.is_nullable === 'YES' ? ' NULL' : ' NOT NULL') + (col.column_default ? ' DEFAULT ' + col.column_default : ''));
    }
  }

  // Step 4: Check RLS policies
  console.log('\n=== RLS POLICIES ===');
  const policiesResult = await client.query(`
    SELECT tablename, policyname, permissive, roles, cmd, qual 
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `);
  for (const p of policiesResult.rows) {
    console.log('  ' + p.tablename + ': ' + p.policyname + ' (' + p.cmd + ') roles=' + p.roles);
  }

  // Step 5: Check triggers
  console.log('\n=== TRIGGERS ===');
  const triggersResult = await client.query(`
    SELECT event_object_table, trigger_name, event_manipulation, action_statement
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name
  `);
  for (const t of triggersResult.rows) {
    console.log('  ' + t.event_object_table + ': ' + t.trigger_name + ' on ' + t.event_manipulation);
  }

  // Step 6: Check functions
  console.log('\n=== FUNCTIONS ===');
  const funcsResult = await client.query(`
    SELECT routine_name, routine_type, data_type
    FROM information_schema.routines
    WHERE specific_schema = 'public' AND routine_name IN (
      'is_admin', 'has_permission', 'can_access_cms', 'user_role_slugs', 'set_updated_at'
    )
    ORDER BY routine_name
  `);
  if (funcsResult.rows.length === 0) {
    console.log('  (no matching functions found)');
  } else {
    for (const f of funcsResult.rows) {
      console.log('  ' + f.routine_name + ': ' + f.routine_type + ' returns ' + f.data_type);
    }
  }

  await client.end();
  console.log('\nDone.');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
