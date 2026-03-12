import { getBrowserSupabaseClient } from '../../lib/supabaseBrowser'
import { getServerSupabaseClient } from '../../lib/supabaseServer'

export const supabase = getBrowserSupabaseClient()
export { getServerSupabaseClient }
