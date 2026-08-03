/* Inspect the local disposable Supabase Postgres schema for CMS-critical columns. */
const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: '127.0.0.1',
    port: 54322,
    user: 'supabase_admin',
    password: 'postgres',
    database: 'postgres',
  });
  await client.connect();
  console.log('Connected to local Supabase Postgres.\n');

  const columnQuery = `
    SELECT table_name, column_name, is_nullable, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('pages','blogs','redirects','sections','city_pages','courses','tools_extended','blog_content_blocks')
      AND column_name IN (
        'canonical_url','created_by','created_at','updated_at','published_at','deleted_at',
        'scheduled_publish_at','scheduled_unpublish_at','old_url','new_url','from_path','to_path',
        'status_code','redirect_type','is_active','is_published','visibility','status','slug',
        'title','content','excerpt','featured_image','image','author','tags','categories','noindex','og_image'
      )
    ORDER BY table_name, column_name
  `;
  const cols = await client.query(columnQuery);
  console.log('=== Columns of interest ===');
  for (const r of cols.rows) {
    console.log(`${r.table_name}.${r.column_name} ${r.data_type} nullable=${r.is_nullable}`);
  }

  const tableQuery = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  const tables = await client.query(tableQuery);
  console.log('\n=== All public tables ===');
  console.log(tables.rows.map((r) => r.table_name).join(', '));

  // Check triggers on pages/blogs
  const triggerQuery = `
    SELECT event_object_table AS table_name, trigger_name
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table
  `;
  const triggers = await client.query(triggerQuery);
  console.log('\n=== Triggers ===');
  for (const t of triggers.rows) {
    console.log(`${t.table_name}: ${t.trigger_name}`);
  }

  // Check unique constraints on pages.slug, blogs.slug
  const uniqueQuery = `
    SELECT tc.table_name, kcu.column_name, tc.constraint_name, tc.constraint_type
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name IN ('pages','blogs','city_pages','courses','tools_extended')
      AND tc.constraint_type IN ('UNIQUE','PRIMARY KEY')
    ORDER BY tc.table_name
  `;
  const uniques = await client.query(uniqueQuery);
  console.log('\n=== Unique / PK constraints ===');
  for (const u of uniques.rows) {
    console.log(`${u.table_name}.${u.column_name}: ${u.constraint_type} (${u.constraint_name})`);
  }

  await client.end();
  console.log('\nDone.');
}

main().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});

