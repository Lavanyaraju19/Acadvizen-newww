/* Apply remaining migrations to local disposable Supabase. */
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

const DB_CONFIG = {
  host: '127.0.0.1',
  port: 54322,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres',
  connectionTimeoutMillis: 15000,
};

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

// Files that failed due to ordering issues - try them again
const RETRY_FILES = [
  '202603130001_cms_expansion_pass2.sql',
  '202603130002_cms_global_settings_pass3.sql',
  '202607220011_page_templates.sql',
  '202607310001_indexes.sql',
  '202607310002_rls_policies.sql',
  '202607310003_zzz_rls_regression_fix.sql',
  '202607310004_zzzz_cms_publish_contract.sql',
  '202607310005_public_api_grants.sql',
];

// Check for the 20260801 production fixes file
const PRODUCTION_FIXES = fs.existsSync(path.join(MIGRATIONS_DIR, '20260801_cms_production_fixes.sql'))
  ? ['20260801_cms_production_fixes.sql']
  : [];

const ALL_FILES = [...RETRY_FILES, ...PRODUCTION_FIXES];

async function main() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  console.log('Connected to local Postgres.\n');

  let applied = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of ALL_FILES) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.log(`  ${file} - NOT FOUND, skipping`);
      skipped++;
      continue;
    }
    const sql = fs.readFileSync(filePath, 'utf8');
    process.stdout.write(`  ${file} ... `);

    try {
      await client.query('BEGIN');
      let cleanedSql = sql.replace(/set search_path\s*=\s*[^;]+;/gi, '');
      await client.query(cleanedSql);
      await client.query('COMMIT');
      process.stdout.write('OK\n');
      applied++;
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      const msg = String(e.message || '').toLowerCase();
      if (msg.includes('already exists') || msg.includes('duplicate') || msg.includes('multiple primary keys')) {
        process.stdout.write('SKIP (already exists)\n');
        skipped++;
      } else {
        process.stdout.write(`FAIL: ${e.message.slice(0, 200)}\n`);
        errors++;
      }
    }
  }

  await client.end();
  console.log(`\nDone. Applied: ${applied}, Skipped: ${skipped}, Errors: ${errors}`);

  // Verify columns that E2E tests need
  const vClient = new Client(DB_CONFIG);
  await vClient.connect();
  
  // Check for created_by on pages
  try {
    const cols = await vClient.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='pages' ORDER BY column_name"
    );
    console.log('\npages columns:', cols.rows.map(r => r.column_name).join(', '));
  } catch (e) {
    console.log('Error checking pages columns:', e.message);
  }

  try {
    const cols = await vClient.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='blogs' ORDER BY column_name"
    );
    console.log('blogs columns:', cols.rows.map(r => r.column_name).join(', '));
  } catch (e) {
    console.log('Error checking blogs columns:', e.message);
  }

  await vClient.end();
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
