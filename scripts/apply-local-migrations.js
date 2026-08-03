/* Apply all CMS migrations to the local disposable Supabase Postgres instance. */
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');
const DB_CONFIG = {
  host: '127.0.0.1',
  port: 54322,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres',
  connectionTimeoutMillis: 15000,
};

const IGNORE_PATTERNS = [
  /20250101_bootstrap/, // Core profiles already exist
];

async function main() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .filter(f => !IGNORE_PATTERNS.some(p => p.test(f)))
    .sort();

  console.log(`Found ${files.length} migration files to apply.\n`);

  const client = new Client(DB_CONFIG);
  await client.connect();
  console.log('Connected to local Postgres.\n');

  // First check existing tables
  const existing = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
  );
  const existingTables = existing.rows.map(r => r.table_name);
  console.log('Existing tables:', existingTables.join(', '), '\n');

  let applied = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    const tableName = file.replace(/\.sql$/, '');

    process.stdout.write(`  ${file} ... `);

    try {
      // Use a transaction per migration
      await client.query('BEGIN');
      
      // Strip search_path setting if it exists (for local compat)
      let cleanedSql = sql.replace(/set search_path\s*=\s*[^;]+;/gi, '');
      
      await client.query(cleanedSql);
      await client.query('COMMIT');
      process.stdout.write('OK\n');
      applied++;
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      // Skip "already exists" errors for idempotency
      const msg = String(e.message || '').toLowerCase();
      if (msg.includes('already exists') || msg.includes('duplicate') || msg.includes('multiple primary keys')) {
        process.stdout.write('SKIP (already exists)\n');
        skipped++;
      } else {
        process.stdout.write(`FAIL: ${e.message.slice(0, 200)}\n`);
        errors++;
        if (errors > 5) {
          console.log('\nToo many errors, stopping.');
          break;
        }
      }
    }
  }

  await client.end();

  console.log(`\nDone. Applied: ${applied}, Skipped: ${skipped}, Errors: ${errors}`);

  // Verify final state
  const verifyClient = new Client(DB_CONFIG);
  await verifyClient.connect();
  const finalTables = await verifyClient.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
  );
  console.log('\nFinal tables:', finalTables.rows.map(r => r.table_name).join(', '));
  await verifyClient.end();
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
