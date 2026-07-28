import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigAvailable } from './env'

let browserClient: SupabaseClient | null = null

export function getBrowserSupabaseClient() {
  if (!isSupabaseConfigAvailable()) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn('[Supabase] Browser client not initialized: SUPABASE_URL or SUPABASE_ANON_KEY is missing')
    }
    return null
  }
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {},
      },
    })
  }
  return browserClient
}

export const supabaseBrowser = getBrowserSupabaseClient()
