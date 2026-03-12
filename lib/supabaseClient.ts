import { getBrowserSupabaseClient, supabaseBrowser } from './supabaseBrowser'

export { getBrowserSupabaseClient }

export const supabase = supabaseBrowser

export function subscribeToRealtime(
  table: string,
  callback: (payload: Record<string, unknown>) => void
) {
  if (!supabase) return null
  const channel = supabase.channel(`realtime:${table}`)
  channel.on('postgres_changes', { event: '*', schema: 'public', table }, payload => {
    callback(payload as Record<string, unknown>)
  })
  channel.subscribe()
  return channel
}

export async function initSupabase() {
  if (!supabase) return null
  try {
    await supabase.auth.getSession()
  } catch {
    return null
  }
  return null
}
