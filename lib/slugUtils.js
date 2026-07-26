/**
 * Comprehensive slug generation and validation utilities
 */

/**
 * Generate a URL-friendly slug from text
 */
export function generateSlug(text) {
  if (!text) return ''
  
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Ensure slug uniqueness in a table
 */
export async function ensureUniqueSlug(supabase, tableName, slug, currentId = null) {
  let uniqueSlug = slug
  let counter = 1
  
  while (true) {
    const { data: existing } = await supabase
      .from(tableName)
      .select('id')
      .eq('slug', uniqueSlug)
      .neq('id', currentId || '')
      .single()
    
    if (!existing) {
      return uniqueSlug
    }
    
    uniqueSlug = `${slug}-${counter}`
    counter++
  }
}

/**
 * Create automatic redirect when slug changes
 */
export async function createSlugRedirect(supabase, oldSlug, newSlug, entityType = 'page') {
  if (!oldSlug || !newSlug || oldSlug === newSlug) {
    return null
  }

  const oldPath = `/${oldSlug}`
  const newPath = `/${newSlug}`

  // Check if redirect already exists
  const { data: existing } = await supabase
    .from('redirects')
    .select('id')
    .eq('old_url', oldPath)
    .single()

  if (existing) {
    // Update existing redirect
    const { data, error } = await supabase
      .from('redirects')
      .update({
        new_url: newPath,
        redirect_type: 301,
        is_active: true,
      })
      .eq('id', existing.id)
      .select('*')
      .single()
    
    return data
  }

  // Create new redirect
  const { data, error } = await supabase
    .from('redirects')
    .insert({
      old_url: oldPath,
      new_url: newPath,
      redirect_type: 301,
      is_active: true,
      notes: `Automatic redirect from ${entityType} slug change`,
    })
    .select('*')
    .single()

  return data
}

/**
 * Validate slug format
 */
export function validateSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return { valid: false, error: 'Slug is required' }
  }

  if (slug.length < 3) {
    return { valid: false, error: 'Slug must be at least 3 characters' }
  }

  if (slug.length > 100) {
    return { valid: false, error: 'Slug must be less than 100 characters' }
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { valid: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' }
  }

  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { valid: false, error: 'Slug cannot start or end with a hyphen' }
  }

  if (slug.includes('--')) {
    return { valid: false, error: 'Slug cannot contain consecutive hyphens' }
  }

  return { valid: true }
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(baseUrl, slug, entityType = 'page') {
  const cleanSlug = slug.startsWith('/') ? slug.slice(1) : slug
  return `${baseUrl}/${cleanSlug}`
}