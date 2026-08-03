const { Client } = require('pg');

const CONNECTION_STRING = 'postgresql://postgres:Acadvizen%212026Staging@hhfccftkfryesjirauwf.supabase.co:5432/postgres';

const REQUIRED_COLUMNS = {
  pages: ['id','title','slug','description','seo_title','seo_description','content','status','created_at','updated_at','is_active','is_published','published_at','scheduled_publish_at','scheduled_unpublish_at','deleted_at','canonical_url','og_image','noindex','exclude_from_sitemap','sections_json','page_template_id','parent_id','order_index','workflow_status','created_by','updated_by'],
  blogs: ['id','title','slug','description','seo_title','seo_description','content','content_json','status','created_at','updated_at','is_active','is_published','published_at','scheduled_publish_at','scheduled_unpublish_at','deleted_at','canonical_url','og_image','noindex','exclude_from_sitemap','featured_image','image','excerpt','tags','categories','author','author_id','faq_schema','created_by'],
  city_pages: ['id','city_name','slug','seo_title','seo_description','canonical_url','is_active','deleted_at','published_at','scheduled_publish_at','scheduled_unpublish_at','priority','created_by','updated_by','created_at','updated_at','exclude_from_sitemap','features','stats','testimonials','gallery','faqs','og_image_url','meta_title','meta_description','focus_keyword','json_ld_schema'],
  location_pages: ['id','title','slug','status','content','sections_json','created_at','updated_at','published_at','scheduled_publish_at','scheduled_unpublish_at','deleted_at','canonical_url','og_image','noindex','exclude_from_sitemap','seo_title','seo_description','created_by'],
  courses: ['id','title','slug','status','is_active','is_published','created_at','updated_at','deleted_at','canonical_url','noindex','seo_title','seo_description','created_by','exclude_from_sitemap'],
  tools_extended: ['id','slug','is_active','created_at','updated_at','deleted_at','created_by'],
  reusable_sections: ['id','slug','status','created_at','updated_at','deleted_at','published_at'],
  reusable_blocks: ['id','slug','status','created_at','updated_at','deleted_at','published_at'],
  page_templates: ['id','name','slug','template_type','template_data','is_default','created_at','updated_at','deleted_at','is_active','created_by'],
  sections: ['id','page_id','type','content_json','order_index','visibility','created_at','updated_at'],
};

async function main() {
  const client = new Client({ connectionString: CONNECTION_STRING, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to staging Supabase.\n');

  const tablesRes = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name`
  );
  const existingTables = new Set(tablesRes.rows.map((r) => r.table_name));
  console.log('=== TABLES PRESENT (' + existingTables.size + ') ===');
  console.log([...existingTables].join(', '));
  console.log('');

  for (const [table, required] of Object.entries(REQUIRED_COLUMNS)) {
    console.log('=== ' + table + ' ===');
    if (!existingTables.has(table)) {
      console.log('  MISSING TABLE');
      console.log('');
      continue;
    }
    const colsRes = await client.query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
      [table]
    );
    const present = new Set(colsRes.rows.map((r) => r.column_name));
    const missing = required.filter((c) => !present.has(c));
    if (missing.length) {
      console.log('  MISSING COLUMNS: ' + missing.join(', '));
    } else {
      console.log('  All required columns present.');
    }
    const types = Object.fromEntries(colsRes.rows.map((r) => [r.column_name, r.data_type]));
    const typeMismatch = required.filter((c) => present.has(c) && types[c] && !['text','character varying'].includes(types[c]) && ['seo_title','seo_description','description','canonical_url','og_image'].includes(c));
    if (typeMismatch.length) {
      console.log('  TYPE CHECK (text-ish): ' + typeMismatch.map((c) => `${c}=${types[c]}`).join(', '));
    }
    console.log('');
  }

  // RLS + triggers + policies summary for key tables
  console.log('=== RLS / TRIGGERS / POLICIES ===');
  for (const table of ['pages','blogs','city_pages','location_pages','courses','sections']) {
    if (!existingTables.has(table)) continue;
    const rls = await client.query(
      `SELECT rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename=$1`,
      [table]
    );
    const triggers = await client.query(
      `SELECT trigger_name FROM information_schema.triggers WHERE trigger_schema='public' AND event_object_table=$1`,
      [table]
    );
    const policies = await client.query(
      `SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=$1 ORDER BY policyname`,
      [table]
    );
    console.log(table + ' | rls=' + (rls.rows[0]?.rowsecurity ? 'ON' : 'OFF') +
      ' | triggers=[' + triggers.rows.map((r) => r.trigger_name).join(',') + ']' +
      ' | policies=[' + policies.rows.map((r) => r.policyname).join(',') + ']');
  }

  // Row counts for key tables
  console.log('\n=== ROW COUNTS ===');
  for (const table of ['pages','blogs','city_pages','location_pages','courses','tools_extended','sections','page_templates']) {
    if (!existingTables.has(table)) continue;
    const res = await client.query(`SELECT count(*) AS n FROM public.${table}`);
    console.log('  ' + table + ': ' + res.rows[0].n);
  }

  await client.end();
  console.log('\nDone.');
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });

