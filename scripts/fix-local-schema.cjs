/* Fix local disposable Supabase schema so E2E CMS tests can run. */
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
  console.log('Connected to local Supabase Postgres.');

  const statements = [
    // redirects: allow new_url/old_url/from_path/to_path to be nullable (tests send only to_path)
    `ALTER TABLE public.redirects ALTER COLUMN new_url DROP NOT NULL`,
    `ALTER TABLE public.redirects ALTER COLUMN old_url DROP NOT NULL`,
    `ALTER TABLE public.redirects ALTER COLUMN from_path DROP NOT NULL`,
    `ALTER TABLE public.redirects ALTER COLUMN to_path DROP NOT NULL`,

    // Ensure created_by columns exist on all CMS content tables
    `ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS created_by uuid`,
    `ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS created_by uuid`,
    `ALTER TABLE IF EXISTS public.sections ADD COLUMN IF NOT EXISTS created_by uuid`,
    `ALTER TABLE IF EXISTS public.city_pages ADD COLUMN IF NOT EXISTS created_by uuid`,
    `ALTER TABLE IF EXISTS public.location_pages ADD COLUMN IF NOT EXISTS created_by uuid`,
    `ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS created_by uuid`,
    `ALTER TABLE IF EXISTS public.tools_extended ADD COLUMN IF NOT EXISTS created_by uuid`,

    // Ensure canonical_url columns (nullable) on content tables
    `ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS canonical_url text`,
    `ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS canonical_url text`,
    `ALTER TABLE IF EXISTS public.city_pages ADD COLUMN IF NOT EXISTS canonical_url text`,
    `ALTER TABLE IF EXISTS public.location_pages ADD COLUMN IF NOT EXISTS canonical_url text`,
    `ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS canonical_url text`,

    // Ensure published_at / deleted_at / scheduling columns
    `ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS published_at timestamptz`,
    `ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamptz`,
    `ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS scheduled_unpublish_at timestamptz`,
    `ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS deleted_at timestamptz`,
    `ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS published_at timestamptz`,
    `ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamptz`,
    `ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS scheduled_unpublish_at timestamptz`,
    `ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS deleted_at timestamptz`,
    `ALTER TABLE IF EXISTS public.city_pages ADD COLUMN IF NOT EXISTS published_at timestamptz`,
    `ALTER TABLE IF EXISTS public.city_pages ADD COLUMN IF NOT EXISTS deleted_at timestamptz`,
    `ALTER TABLE IF EXISTS public.location_pages ADD COLUMN IF NOT EXISTS published_at timestamptz`,
    `ALTER TABLE IF EXISTS public.location_pages ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamptz`,
    `ALTER TABLE IF EXISTS public.location_pages ADD COLUMN IF NOT EXISTS scheduled_unpublish_at timestamptz`,
    `ALTER TABLE IF EXISTS public.location_pages ADD COLUMN IF NOT EXISTS deleted_at timestamptz`,
    `ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS published_at timestamptz`,
    `ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamptz`,
    `ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS scheduled_unpublish_at timestamptz`,
    `ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS deleted_at timestamptz`,
    `ALTER TABLE IF EXISTS public.tools_extended ADD COLUMN IF NOT EXISTS published_at timestamptz`,
    `ALTER TABLE IF EXISTS public.tools_extended ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamptz`,
    `ALTER TABLE IF EXISTS public.tools_extended ADD COLUMN IF NOT EXISTS scheduled_unpublish_at timestamptz`,
    `ALTER TABLE IF EXISTS public.tools_extended ADD COLUMN IF NOT EXISTS deleted_at timestamptz`,

    // Ensure blog SEO columns
    `ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS seo_title text`,
    `ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS seo_description text`,
    `ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS meta_title text`,
    `ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS meta_description text`,
    `ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS og_image text`,
    `ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS noindex boolean NOT NULL DEFAULT false`,
    `ALTER TABLE IF EXISTS public.blogs ADD COLUMN IF NOT EXISTS faq_schema jsonb`,

    // Ensure pages SEO columns
    `ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS seo_title text`,
    `ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS seo_description text`,
    `ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS og_image text`,
    `ALTER TABLE IF EXISTS public.pages ADD COLUMN IF NOT EXISTS noindex boolean NOT NULL DEFAULT false`,

    // Ensure updated_at triggers exist for all CMS tables
    `CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
     BEGIN NEW.updated_at = now(); RETURN NEW; END;
     $$`,
  ];

  for (const sql of statements) {
    try {
      await client.query(sql);
      console.log('  OK: ' + sql.replace(/\s+/g, ' ').slice(0, 90));
    } catch (e) {
      console.log('  WARN: ' + e.message.slice(0, 140));
    }
  }

  // Verify redirects columns now
  const redir = await client.query(
    `SELECT column_name, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='redirects' AND column_name IN ('new_url','old_url','from_path','to_path') ORDER BY column_name`
  );
  console.log('\n=== redirects columns ===');
  for (const r of redir.rows) console.log(`  ${r.column_name} nullable=${r.is_nullable}`);

  await client.end();
  console.log('\nDone.');
}

main().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});

