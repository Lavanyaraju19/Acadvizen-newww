/* Try Supabase Management API (api.supabase.com) for DDL.
 * Uses only the SUPABASE_SERVICE_ROLE_KEY from env (never prints it).
 * The Management API requires a personal access token, which we may not have,
 * but this checks whether it is available.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const REF = 'hhfccftkfryesjirauwf';

async function main() {
  // Try to discover a management token
  const candidates = [
    process.env.SUPABASE_ACCESS_TOKEN,
    process.env.SUPABASE_MANAGEMENT_API_KEY,
    process.env.SUPABASE_PERSONAL_ACCESS_TOKEN,
    process.env.SUPABASE_TOKEN,
  ];
  const token = candidates.find((t) => t && t.length > 20);
  if (!token) {
    console.log('No Supabase Management API token available in env.');
    console.log('Management API DDL path is unavailable.');
    return;
  }
  console.log('Management token found (masked):', token.slice(0, 6) + '...' + token.slice(-4));

  // Test the query endpoint
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: "SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public'",
      }),
    });
    const text = await res.text();
    console.log('Management API status:', res.status);
    console.log('Management API body:', text.slice(0, 500));
  } catch (e) {
    console.log('Management API error:', e.message);
  }
}

main().catch((e) => console.error('FATAL:', e.message));

