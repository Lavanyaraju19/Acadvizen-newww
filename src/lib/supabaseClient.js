import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchWithRetry(input, init = {}, retries = 2) {
  try {
    console.debug('[supabase] fetch', typeof input === 'string' ? input : input?.url || 'request')
    return await fetch(input, init)
  } catch (err) {
    const message = err?.message || ''
    const isAbort = err?.name === 'AbortError' || message.includes('signal is aborted')
    const isNetwork = message.includes('Failed to fetch')
    if ((isAbort || isNetwork) && retries > 0) {
      await sleep(600)
      const nextInit = { ...init }
      if (isAbort && nextInit.signal) {
        delete nextInit.signal
      }
      return fetchWithRetry(input, nextInit, retries - 1)
    }
    throw err
  }
}

export function hasSupabaseEnv() {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

if (!hasSupabaseEnv()) {
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them to .env and restart the dev server.',
  )
}

export const supabase = hasSupabaseEnv()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      global: {
        fetch: fetchWithRetry,
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      global: {
        fetch: fetchWithRetry,
      },
    })

export async function initSupabase() {
  try {
    console.info('[supabase] env loaded:', supabaseUrl || '(missing)')
    if (!hasSupabaseEnv()) {
      console.warn('[supabase] skipping connection test because env vars are missing')
      return
    }
    const { error } = await supabase.auth.getSession()
    if (error) {
      console.warn('[supabase] auth session check error:', error.message)
    } else {
      console.info('[supabase] auth session check ok')
    }
  } catch (err) {
    const message = err?.message || String(err)
    if (err?.name === 'AbortError' || message.includes('signal is aborted')) {
      console.warn('[supabase] request aborted; ignoring during startup')
      return
    }
    if (message.includes('Failed to fetch')) {
      console.error('[supabase] network error: unable to reach Supabase', message)
    } else {
      console.error('[supabase] unexpected error:', message)
    }
  }
}
