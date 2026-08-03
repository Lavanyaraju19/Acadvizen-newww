/* Find the correct Supabase pooler region + connection for the staging project. */
const dns = require('node:dns');
const { Client } = require('pg');
dns.setDefaultResultOrder('ipv4first');

const REF = 'hhfccftkfryesjirauwf';
const PASSWORD = 'Acadvizen!2026Staging';

const REGIONS = [
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-east-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'sa-east-1',
  'ca-central-1',
];

async function tryHost(region, port) {
  const client = new Client({
    host: `aws-0-${region}.pooler.supabase.com`,
    port,
    user: `postgres.${REF}`,
    password: PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });
  try {
    await client.connect();
    const res = await client.query('SELECT 1 as ok');
    console.log(`  ✓ ${region}:${port} CONNECTED (${res.rows[0].ok})`);
    await client.end();
    return true;
  } catch (e) {
    const msg = e.message || String(e);
    if (msg.includes('tenant') || msg.includes('not found') || msg.includes('password authentication')) {
      console.log(`  ✗ ${region}:${port} ${msg.slice(0, 90)}`);
    } else {
      console.log(`  ✗ ${region}:${port} ${msg.slice(0, 90)}`);
    }
    try { await client.end(); } catch {}
    return false;
  }
}

async function main() {
  console.log('Trying Supabase pooler regions (transaction mode port 6543):');
  for (const region of REGIONS) {
    const ok = await tryHost(region, 6543);
    if (ok) return;
  }
  console.log('\nTrying session mode port 5432:');
  for (const region of REGIONS) {
    const ok = await tryHost(region, 5432);
    if (ok) return;
  }
  console.log('\nNo pooler connection succeeded.');
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });

