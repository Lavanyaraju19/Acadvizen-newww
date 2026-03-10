import { createClient } from '@supabase/supabase-js'

// Grab values from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Ensure config exists
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase configuration missing. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
  )
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Optional: init function to verify connection/auth
export async function initSupabase() {
  try {
    await supabase.auth.getSession()
  } catch (error) {
    console.warn('Supabase init check failed:', error?.message || error)
  }
}