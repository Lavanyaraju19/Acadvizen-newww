/**
 * Which /blog/<slug> addresses already belong to the Main Website (Supabase). Read-only.
 */
import { getServerSupabaseClient } from '../supabaseServer'
import { fetchRedirectByPath } from '../cmsServer'
import { normalizeBlogStatus } from '../blogVisibility.js'
import { staticBlogSlugConflict } from './blogPrecedence.js'

function getReadClient() {
  // Service role (server-only) so unpublished Main blogs are also seen and protected.
  return getServerSupabaseClient({ preferServiceRole: true })
}

/**
 * Every non-deleted Supabase blog slug among `slugs`. Throws on failure so callers can fail
 * closed (show no WordPress blogs) rather than risk shadowing an existing Main blog.
 */
export async function fetchMainOwnedBlogSlugs(slugs = []) {
  const unique = Array.from(new Set(slugs.filter(Boolean)))
  if (!unique.length) return new Set()
  const supabase = getReadClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase.from('blogs').select('slug,deleted_at').in('slug', unique)
  if (error) throw new Error(`Main blog slug lookup failed: ${error.message}`)
  return new Set((data || []).filter((row) => !row.deleted_at).map((row) => row.slug))
}

/**
 * Used by the WordPress admin warning. Never throws.
 * @returns {Promise<{checked: boolean, conflict: boolean, reason: string|null}>}
 */
export async function checkMainBlogSlug(slug) {
  const staticConflict = staticBlogSlugConflict(slug)
  if (staticConflict) return { checked: true, conflict: true, reason: staticConflict }

  const supabase = getReadClient()
  if (!supabase) return { checked: false, conflict: false, reason: null }

  const { data, error } = await supabase.from('blogs').select('slug,status,deleted_at').eq('slug', slug).limit(5)
  if (error) return { checked: false, conflict: false, reason: null }

  const rows = (data || []).filter((row) => !row.deleted_at)
  if (rows.length) {
    const published = rows.some((row) => normalizeBlogStatus(row.status) === 'published')
    return { checked: true, conflict: true, reason: published ? 'existing_blog' : 'existing_draft' }
  }

  const redirect = await fetchRedirectByPath(`/blog/${slug}`)
  if (redirect?.to_path) return { checked: true, conflict: true, reason: 'redirect' }

  return { checked: true, conflict: false, reason: null }
}
