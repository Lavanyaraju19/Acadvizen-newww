require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const keys = Object.keys(process.env).sort();
const interesting = keys.filter((k) => {
  const lower = k.toLowerCase();
  return (
    lower.includes('supabase') ||
    lower.includes('database') ||
    lower.includes('postgres') ||
    lower.includes('pg') ||
    lower.includes('db_') ||
    lower.includes('management') ||
    lower.includes('access_token') ||
    lower.includes('vercel') ||
    lower.includes('e2e') ||
    lower.includes('app_url') ||
    lower.includes('revalid')
  );
});

console.log('=== Relevant environment variable NAMES (values hidden) ===');
for (const k of interesting) {
  const v = process.env[k] || '';
  const masked = v.length > 8 ? v.slice(0, 4) + '...' + v.slice(-4) : v ? '***' : '(empty)';
  console.log(`${k} = ${masked}`);
}

