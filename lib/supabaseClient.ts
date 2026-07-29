/**
 * Re-export the browser Supabase client from the canonical source.
 * This file exists for backward compatibility.
 */
export { getBrowserSupabaseClient } from './supabaseBrowser'
export { ensureBrowserSupabaseClient, ensureBrowserSupabaseConfig, getBrowserSupabaseConfig } from './supabaseBrowser'
export { supabaseBrowser as supabase } from './supabaseBrowser'

/**
 * Subscribe to realtime changes on a table.
 * IMPORTANT: Caller MUST unsubscribe by calling channel.unsubscribe()
 * on the returned channel when done, to prevent memory leaks.
 */
export function subscribeToRealtime(
  table: string,
  callback: (payload: Record<string, unknown>) => void
) {
  const { getBrowserSupabaseClient } = require('./supabaseBrowser')
  const supabase = getBrowserSupabaseClient()
  if (!supabase) return null
  const channel = supabase.channel(`realtime:${table}`)
  channel.on('postgres_changes', { event: '*', schema: 'public', table }, payload => {
    callback(payload as Record<string, unknown>)
  })
  channel.subscribe()
  return channel
}
