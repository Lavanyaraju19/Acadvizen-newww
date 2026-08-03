const { Client } = require('pg');

const REF = 'hhfccftkfryesjirauwf';
const PASSWORD = 'Acadvizen!2026Staging';

const CANDIDATES = [
  // Direct
  { host: `${REF}.supabase.co`, port: 5432, user: 'postgres' },
  // Pooler legacy hostname formats
  { host: `${REF}.pooler.supabase.com`, port: 6543, user: `postgres.${REF}` },
  { host: `${REF}.pooler.supabase.com`, port: 5432, user: `postgres.${REF}` },
  // db hostname
  { host: `db.${REF}.supabase.co`, port: 5432, user: 'postgres' },
  // Pooler region-less aws-0
  { host: `aws-0-${REF}.pooler.supabase.com`, port: 6543, user: `postgres.${REF}` },
];

async function tryConn(c) {
  const client = new Client({
    host: c.host,
    port: c.port,
    user: c.user,
    password: PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });
  const label = `${c.user}@${c.host}:${c.port}`;
  try {
    await client.connect();
    const res = await client.query('select version()');
    console.log(`  ✓ ${label} CONNECTED\n    ${res.rows[0].version.slice(0, 80)}`);
    await client.end();
    return true;
  } catch (e) {
    console.log(`  ✗ ${label} — ${(e.message || String(e)).slice(0, 110)}`);
    try { await client.end(); } catch {}
    return false;
  }
}

async function main() {
  console.log('Trying candidate staging DB connections...');
  for (const c of CANDIDATES) {
    const ok = await tryConn(c);
    if (ok) return;
  }
  console.log('\nNo candidate connection succeeded.');
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });

