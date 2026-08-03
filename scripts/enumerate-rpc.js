require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  console.log('URL:', url);

  // 1. List RPC functions available to the service role via PostgREST root
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
    console.log('Root status:', res.status);
    const text = await res.text();
    const definitions = JSON.parse(text);
    const paths = Object.keys(definitions.paths || {});
    const rpc = paths.filter((p) => p.startsWith('/rpc/'));
    console.log('RPC endpoints:', JSON.stringify(rpc, null, 0));
  } catch (e) {
    console.log('Root error:', e.message);
  }

  // 2. Try known RPCs for executing SQL
  const candidateRPCs = ['exec_sql', 'exec', 'run_sql', 'execute_sql', 'sql', 'query_sql', 'create_table', 'exec_sql_ddl'];
  for (const rpcName of candidateRPCs) {
    try {
      const { data, error } = await supabase.rpc(rpcName, { sql: 'SELECT 1' });
      console.log(`RPC ${rpcName}:`, error ? `ERR ${error.message}` : JSON.stringify(data).slice(0, 120));
    } catch (e) {
      console.log(`RPC ${rpcName}:`, 'THROW', e.message.slice(0, 120));
    }
  }

  // 3. Try the auth schema's own RPCs (may be usable with service role)
  const authRPCs = ['signup', 'signin', 'admin_create_user', 'get_user', 'verify'];
  for (const rpcName of authRPCs) {
    try {
      const { data, error } = await supabase.auth[rpcName]?.();
      console.log(`AUTH RPC ${rpcName}:`, error ? `ERR ${error.message}` : 'OK');
    } catch (e) {
      console.log(`AUTH RPC ${rpcName}:`, 'THROW', e.message.slice(0, 80));
    }
  }
}

main().catch((e) => console.error('FATAL:', e.message));

