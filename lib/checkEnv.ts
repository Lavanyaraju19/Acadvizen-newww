// Ensure required environment variables are configured in:
// - .env.local (local development)
// - Vercel → Project Settings → Environment Variables (production)
export function checkEnv() {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']

  required.forEach((key) => {
    if (!process.env[key]) {
      console.warn(`⚠ Missing environment variable: ${key}`)
    }
  })
}
