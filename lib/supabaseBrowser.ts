import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type PublicSupabaseConfig = {
  url: string
  anonKey: string
}

let browserClient: SupabaseClient | null = null
let configPromise: Promise<PublicSupabaseConfig | null> | null = null
let browserConfig: PublicSupabaseConfig | null = null
export let supabaseBrowser: SupabaseClient | null = null

function normalizeConfig(url: string, anonKey: string): PublicSupabaseConfig | null {
  if (!url || !anonKey) return null
  return { url, anonKey }
}

function createBrowserClient(config: PublicSupabaseConfig) {
  return createClient(config.url, config.anonKey, {
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

function setBrowserConfig(config: PublicSupabaseConfig | null) {
  if (!config) return null
  browserConfig = config
  return browserConfig
}

export function getBrowserSupabaseConfig() {
  return browserConfig
}

export function getBrowserSupabaseClient() {
  if (browserClient) return browserClient

  const config = browserConfig
  if (!config) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn('[Supabase] Browser client not initialized: SUPABASE_URL or SUPABASE_ANON_KEY is missing')
    }
    return null
  }

  browserClient = createBrowserClient(config)
  supabaseBrowser = browserClient
  return browserClient
}

export async function ensureBrowserSupabaseConfig() {
  if (browserConfig) return browserConfig
  if (typeof window === 'undefined') return null
  if (configPromise) return configPromise

  configPromise = (async () => {
    try {
      const response = await fetch('/api/public-config', { cache: 'no-store' })
      if (!response.ok) return null

      const payload = await response.json()
      const config = normalizeConfig(payload?.data?.url || '', payload?.data?.anonKey || '')
      return setBrowserConfig(config)
    } catch {
      return null
    } finally {
      configPromise = null
    }
  })()

  return configPromise
}

export async function ensureBrowserSupabaseClient() {
  const existingClient = getBrowserSupabaseClient()
  if (existingClient) return existingClient

  const config = await ensureBrowserSupabaseConfig()
  if (!config) return null

  browserClient = createBrowserClient(config)
  supabaseBrowser = browserClient
  return browserClient
}

supabaseBrowser = getBrowserSupabaseClient()
