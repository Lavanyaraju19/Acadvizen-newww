/* Fix migration errors found during apply. */
const { Client } = require('pg');

async function main() {
  const pg = new Client({
    host: '127.0.0.1', port: 54322,
    user: 'supabase_admin', password: 'postgres',
    database: 'postgres',
    connectionTimeoutMillis: 10000,
  });
  await pg.connect();
  console.log('Connected.');

  // 1. Fix roles table - add description column
  console.log('\n1. Fixing roles table...');
  try {
    await pg.query(`ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS description text`);
    console.log('   Added description column to roles');
  } catch (e) {
    console.log('   Error:', e.message.slice(0, 100));
  }

  // 2. Check which tables need slug columns
  console.log('\n2. Checking slug columns...');
  const tables = ['pages', 'blogs', 'location_pages', 'city_pages', 'courses', 'tools_extended', 'reusable_sections', 'reusable_blocks', 'page_templates'];
  for (const tbl of tables) {
    const exists = await pg.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'slug'
    `, [tbl]);
    if (exists.rows.length === 0) {
      console.log(`   Adding slug column to ${tbl}...`);
      try {
        await pg.query(`ALTER TABLE public.${tbl} ADD COLUMN IF NOT EXISTS slug text`);
        console.log(`   Added slug to ${tbl}`);
      } catch (e) {
        console.log(`   Error on ${tbl}:`, e.message.slice(0, 100));
      }
    } else {
      console.log(`   ${tbl} already has slug column`);
    }
  }

  // 3. Check for missing indexes on slug columns
  console.log('\n3. Adding slug indexes...');
  for (const tbl of tables) {
    try {
      const hasIndex = await pg.query(`
        SELECT 1 FROM pg_indexes WHERE tablename = $1 AND indexname = $2
      `, [tbl, `${tbl}_slug_idx`]);
      if (hasIndex.rows.length === 0) {
        await pg.query(`CREATE INDEX IF NOT EXISTS ${tbl}_slug_idx ON public.${tbl}(slug)`);
        console.log(`   Created index on ${tbl}.slug`);
      }
    } catch (e) {
      // Skip if table doesn't have slug column
    }
  }

  // 4. Add missing publish contract columns
  console.log('\n4. Adding publish contract columns...');
  for (const tbl of tables) {
    try {
      await pg.query(`ALTER TABLE public.${tbl} ADD COLUMN IF NOT EXISTS deleted_at timestamptz`);
      await pg.query(`ALTER TABLE public.${tbl} ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()`);
      await pg.query(`DROP TRIGGER IF EXISTS set_${tbl}_updated_at ON public.${tbl}`);
      await pg.query(`CREATE TRIGGER set_${tbl}_updated_at BEFORE UPDATE ON public.${tbl} FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()`);
    } catch (e) {
      // Skip if set_updated_at function doesn't exist
    }
  }

  // 5. Add published_at, scheduled_publish_at, scheduled_unpublish_at to pages, blogs, location_pages
  console.log('\n5. Adding scheduling columns...');
  const schedulingTables = ['pages', 'blogs', 'location_pages'];
  for (const tbl of schedulingTables) {
    try {
      await pg.query(`ALTER TABLE public.${tbl} ADD COLUMN IF NOT EXISTS published_at timestamptz`);
      await pg.query(`ALTER TABLE public.${tbl} ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamptz`);
      await pg.query(`ALTER TABLE public.${tbl} ADD COLUMN IF NOT EXISTS scheduled_unpublish_at timestamptz`);
      console.log(`   Added scheduling columns to ${tbl}`);
    } catch (e) {
      console.log(`   Error on ${tbl}:`, e.message.slice(0, 100));
    }
  }

  // 6. Add status field to pages, blogs, location_pages
  console.log('\n6. Adding status columns...');
  const statusTables = ['pages', 'blogs', 'location_pages'];
  for (const tbl of statusTables) {
    try {
      await pg.query(`ALTER TABLE public.${tbl} ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft'`);
      await pg.query(`ALTER TABLE public.${tbl} ADD COLUMN IF NOT EXISTS created_by uuid`);
      console.log(`   Added status/created_by to ${tbl}`);
    } catch (e) {
      console.log(`   Error on ${tbl}:`, e.message.slice(0, 100));
    }
  }

  // 7. Ensure RLS is enabled on all CMS tables
  console.log('\n7. Enabling RLS on CMS tables...');
  for (const tbl of tables) {
    try {
      await pg.query(`ALTER TABLE public.${tbl} ENABLE ROW LEVEL SECURITY`);
      console.log(`   RLS enabled on ${tbl}`);
    } catch (e) {
      console.log(`   Error on ${tbl}:`, e.message.slice(0, 100));
    }
  }

  console.log('\nDone fixing migration errors.');
  await pg.end();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
