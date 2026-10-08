/**
 * Whether a Main Website address is already used by this application (read-only). Used for the
 * WordPress admin warning when an Elementor page is published to the Main Website.
 */
import { getServerSupabaseClient } from '../supabaseServer'
import { fetchRedirectByPath } from '../cmsServer'
import { mainOwnedReason } from './bridgeRouting.js'

// CMS tables resolved by app/(public)/[slug] at /{slug}.
const SINGLE_SEGMENT_TABLES = ['pages', 'location_pages', 'service_pages']

/**
 * @returns {Promise<{checked: boolean, conflict: boolean, reason: string|null}>} never throws
 */
export async function checkMainPagePath(path) {
  const owned = mainOwnedReason(path)
  if (owned) return { checked: true, conflict: true, reason: owned }

  const segments = path.split('/').filter(Boolean)
  if (segments.length === 1) {
    const supabase = getServerSupabaseClient({ preferServiceRole: true })
    if (!supabase) return { checked: false, conflict: false, reason: null }
    for (const table of SINGLE_SEGMENT_TABLES) {
      const { data, error } = await supabase.from(table).select('slug').eq('slug', segments[0]).limit(1)
      if (error) {
        const missingTable = String(error.message || '').toLowerCase().includes('does not exist')
        if (missingTable) continue
        return { checked: false, conflict: false, reason: null }
      }
      if (data?.length) return { checked: true, conflict: true, reason: 'existing_page' }
    }
  }

  const redirect = await fetchRedirectByPath(path)
  if (redirect?.to_path) return { checked: true, conflict: true, reason: 'redirect' }
  return { checked: true, conflict: false, reason: null }
}
