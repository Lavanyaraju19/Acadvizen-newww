/* Find the local Supabase Postgres port and test postgres/postgres. */
const net = require('node:net');
const { Client } = require('pg');

const PORTS = [54322, 54321, 55322, 55321, 55432, 5432, 6543, 54323, 55323, 54324];

function probePort(port, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const onDone = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => onDone(true));
    socket.once('timeout', () => onDone(false));
    socket.once('error', () => onDone(false));
    socket.connect(port, '127.0.0.1');
  });
}

async function tryConnect(port) {
  const client = new Client({
    host: '127.0.0.1',
    port,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
    connectionTimeoutMillis: 6000,
  });
  try {
    await client.connect();
    const res = await client.query('SELECT 1 as ok');
    console.log(`  ✓ port ${port} CONNECTED (${res.rows[0].ok})`);
    await client.end();
    return true;
  } catch (e) {
    console.log(`  ✗ port ${port}: ${String(e.message).slice(0, 120)}`);
    try { await client.end(); } catch {}
    return false;
  }
}

async function main() {
  console.log('Probing local Postgres ports...');
  for (const port of PORTS) {
    const open = await probePort(port);
    if (open) {
      console.log(`  port ${port} is OPEN - trying postgres/postgres`);
      if (await tryConnect(port)) {
        return;
      }
    }
  }
  console.log('No local Postgres with postgres/postgres found.');
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });

