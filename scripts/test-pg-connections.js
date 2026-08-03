/* Diagnostic: find a working PostgreSQL connection to staging Supabase.
 * Tries multiple strategies (IPv4-first DNS, direct host, db host, pooler).
 * Only prints connection success/failure - never prints secrets.
 */
const dns = require('node:dns');
const { Client } = require('pg');

dns.setDefaultResultOrder('ipv4first');

const PASSWORD = 'Acadvizen!2026Staging';
const REF = 'hhfccftkfryesjirauwf';

const strategies = [
  {
    name: 'direct-connstring-ipv4first',
    config: {
      connectionString: `postgresql://postgres:${encodeURIComponent(PASSWORD)}@${REF}.supabase.co:5432/postgres`,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    },
  },
  {
    name: 'direct-host-ipv4first',
    config: {
      host: `${REF}.supabase.co`,
      port: 5432,
      user: 'postgres',
      password: PASSWORD,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    },
  },
  {
    name: 'db-subdomain',
    config: {
      host: `db.${REF}.supabase.co`,
      port: 5432,
      user: 'postgres',
      password: PASSWORD,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    },
  },
  {
    name: 'pooler-6543',
    config: {
      host: `aws-0-ap-south-1.pooler.supabase.com`,
      port: 6543,
      user: `postgres.${REF}`,
      password: PASSWORD,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    },
  },
  {
    name: 'pooler-5432',
    config: {
      host: `aws-0-ap-south-1.pooler.supabase.com`,
      port: 5432,
      user: `postgres.${REF}`,
      password: PASSWORD,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    },
  },
];

async function tryConnect(strategy) {
  const client = new Client(strategy.config);
  try {
    await client.connect();
    const res = await client.query('SELECT 1 as ok');
    const tables = await client.query(
      "SELECT count(*)::int as n FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log(`  ✓ ${strategy.name}: CONNECTED (${res.rows[0].ok}, public tables: ${tables.rows[0].n})`);
    await client.end();
    return strategy.name;
  } catch (e) {
    console.log(`  ✗ ${strategy.name}: ${e.message}`);
    try {
      await client.end();
    } catch {}
    return null;
  }
}

async function main() {
  console.log('Testing PostgreSQL connection strategies...');
  let winner = null;
  for (const s of strategies) {
    const ok = await tryConnect(s);
    if (ok) {
      winner = ok;
      break;
    }
  }
  if (!winner) {
    console.log('\nNo working direct pg connection found.');
    console.log('Falling back to REST API + exec_sql alternatives for DDL.');
  } else {
    console.log(`\nWinner: ${winner}`);
  }
}

main().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});

