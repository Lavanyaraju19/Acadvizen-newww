import { getServerSupabaseClient } from '../../lib/supabaseServer'

async function fetchFromTable(table, queryBuilder) {
  try {
    const supabase = getServerSupabaseClient()
    if (!supabase) return []
    const { data, error } = await queryBuilder(supabase.from(table).select('*'))
    if (error || !Array.isArray(data)) return null
    return data[0] || null
  } catch {
    return null
  }
}

export async function fetchCourseBySlug(slug) {
  return fetchFromTable('courses', (query) =>
    query
      .select('title,short_description,description,slug')
      .eq('slug', slug)
      .limit(1)
  )
}

export async function fetchToolBySlug(slug) {
  return fetchFromTable('tools_extended', (query) =>
    query.select('name,description,slug').eq('slug', slug).limit(1)
  )
}

export async function fetchPlacementById(id) {
  return fetchFromTable('placements', (query) =>
    query
      .select('title,description,role,company_name,id')
      .eq('is_active', true)
      .eq('id', id)
      .limit(1)
  )
}
