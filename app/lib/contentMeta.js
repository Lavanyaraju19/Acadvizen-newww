const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function fetchFromTable(table, query) {
  if (!SUPABASE_URL || !SUPABASE_ANON) return null
  const endpoint = `${SUPABASE_URL}/rest/v1/${table}?${query}`
  try {
    const res = await fetch(endpoint, {
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
      },
      next: { revalidate: 900 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data) ? data[0] || null : null
  } catch {
    return null
  }
}

export async function fetchCourseBySlug(slug) {
  return fetchFromTable('courses', `select=title,short_description,description,slug&slug=eq.${encodeURIComponent(slug)}&limit=1`)
}

export async function fetchToolBySlug(slug) {
  return fetchFromTable('tools_extended', `select=name,description,slug&slug=eq.${encodeURIComponent(slug)}&limit=1`)
}

export async function fetchPlacementById(id) {
  return fetchFromTable(
    'placements',
    `select=title,description,role,company_name,id&is_active=eq.true&id=eq.${encodeURIComponent(id)}&limit=1`
  )
}
