import type { RealtimeChannel } from '@supabase/supabase-js'
import { getBrowserSupabaseClient } from './supabaseBrowser'

export function subscribeToTable(
  tableName: string,
  callback: (payload: Record<string, unknown>) => void
): RealtimeChannel | null {
  const supabase = getBrowserSupabaseClient()
  if (!supabase) return null
  const channel = supabase.channel(`realtime-${tableName}`)
  channel.on('postgres_changes', { event: '*', schema: 'public', table: tableName }, payload => {
    callback(payload as Record<string, unknown>)
  })
  channel.subscribe()
  return channel
}
