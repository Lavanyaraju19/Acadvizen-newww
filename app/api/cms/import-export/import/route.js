import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
} from '../../_utils'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await request.json()
  const { type, format, data } = body

  if (!type || !data || !Array.isArray(data)) {
    return jsonError('Invalid request', 400)
  }

  let table = ''
  let errors = []
  let success = 0
  let failed = 0

  switch (type) {
    case 'pages':
      table = 'pages'
      break
    case 'cities':
      table = 'city_pages'
      break
    case 'blogs':
      table = 'blogs'
      break
    case 'courses':
      table = 'courses'
      break
    case 'forms':
      table = 'forms'
      break
    case 'menus':
      table = 'menus'
      break
    case 'leads':
      table = 'leads'
      break
    case 'users':
      table = 'profiles'
      break
    case 'settings':
      // Settings import is special - update single row
      try {
        const { error } = await supabase.from('global_settings').update(data[0]).eq('id', data[0].id)
        if (error) throw error
        return jsonOk({ success: 1, failed: 0, errors: [] })
      } catch (error) {
        return jsonError(`Settings import failed: ${error.message}`, 200)
      }
    default:
      return jsonError('Invalid type', 400)
  }

  // Import data
  for (const item of data) {
    try {
      // Validate required fields based on type
      if (type === 'pages' && !item.slug) throw new Error('Missing slug')
      if (type === 'blogs' && !item.slug) throw new Error('Missing slug')
      if (type === 'courses' && !item.slug) throw new Error('Missing slug')
      if (type === 'forms' && !item.name) throw new Error('Missing name')
      if (type === 'menus' && !item.title) throw new Error('Missing title')

      // Remove id to create new records
      const { id, ...itemData } = item

      const { error } = await supabase.from(table).insert(itemData)
      if (error) throw error
      success++
    } catch (error) {
      failed++
      errors.push(error.message)
    }
  }

  return jsonOk({ success, failed, errors })
}